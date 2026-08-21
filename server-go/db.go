package main

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/argon2"
	_ "modernc.org/sqlite"
)

var (
	loginAttempts = make(map[string]struct {
		count    int
		lastTime time.Time
	})
	loginMu sync.Mutex
)

func checkLoginRateLimit(ip string) bool {
	loginMu.Lock()
	defer loginMu.Unlock()
	entry, exists := loginAttempts[ip]
	now := time.Now()
	if !exists || now.Sub(entry.lastTime) > 1*time.Minute {
		loginAttempts[ip] = struct {
			count    int
			lastTime time.Time
		}{count: 1, lastTime: now}
		return true
	}
	if entry.count >= 5 {
		return false
	}
	loginAttempts[ip] = struct {
		count    int
		lastTime time.Time
	}{count: entry.count + 1, lastTime: now}
	return true
}

func resetLoginRateLimit(ip string) {
	loginMu.Lock()
	delete(loginAttempts, ip)
	loginMu.Unlock()
}

// startLoginRateLimitCleanup periodically purges expired login rate-limit entries.
// main() wraps this in a goroutine, so no extra go is needed here.
func startLoginRateLimitCleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		loginMu.Lock()
		now := time.Now()
		for ip, entry := range loginAttempts {
			if now.Sub(entry.lastTime) > 1*time.Minute {
				delete(loginAttempts, ip)
			}
		}
		loginMu.Unlock()
	}
}

var db *sql.DB
var dataDir = "."

// execSQL executes a statement and returns any error.
// Use for user-facing operations where errors must be reported.
func execSQL(query string, args ...interface{}) error {
	_, err := db.Exec(query, args...)
	if err != nil {
		log.Printf("sql exec error: %s — %v", query, err)
	}
	return err
}

// execSQLLog executes a statement and logs any error without returning it.
// Use for best-effort operations (cache, cleanup, startup).
func execSQLLog(query string, args ...interface{}) {
	if _, err := db.Exec(query, args...); err != nil {
		log.Printf("sql exec error: %s — %v", query, err)
	}
}

var allowedUploadExts = map[string]bool{
	".png": true, ".jpg": true, ".jpeg": true,
	".gif": true, ".webp": true, ".ico": true, ".bmp": true,
}

func uploadsDir() string {
	return filepath.Join(dataDir, "uploads")
}

func initDB() {
	dbPath := filepath.Join(dataDir, "suisui.db")
	os.MkdirAll(filepath.Join(dataDir, "uploads"), 0755)
	var err error
	db, err = sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatal(err)
	}
	execSQLLog("PRAGMA journal_mode=WAL")
	execSQLLog("PRAGMA foreign_keys=ON")
	tables := []string{
		`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, applied_at INTEGER)`,
		`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, nickname TEXT DEFAULT '', avatar TEXT DEFAULT '', role TEXT DEFAULT 'user', created_at INTEGER DEFAULT 0)`,
		`CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, content TEXT, created_at INTEGER, updated_at INTEGER, pinned INTEGER DEFAULT 0, tags TEXT DEFAULT '[]', username TEXT, avatar TEXT, nickname TEXT)`,
		`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
		`CREATE TABLE IF NOT EXISTS reactions (id TEXT, emoji TEXT, username TEXT, PRIMARY KEY (id, emoji, username))`,
		`CREATE TABLE IF NOT EXISTS trash (id TEXT PRIMARY KEY, content TEXT, created_at INTEGER, updated_at INTEGER, pinned INTEGER DEFAULT 0, tags TEXT DEFAULT '[]', username TEXT, avatar TEXT, nickname TEXT, deleted_at INTEGER)`,
		`CREATE TABLE IF NOT EXISTS auth_tokens (token TEXT PRIMARY KEY, username TEXT, created_at INTEGER)`,
	}
	for _, t := range tables {
		if _, err := db.Exec(t); err != nil {
			log.Fatal(err)
		}
	}
	migrate()
}

const schemaVersion = 3

func migrate() {
	var version int
	err := db.QueryRow("SELECT COALESCE(MAX(version), 0) FROM schema_version").Scan(&version)
	if err != nil {
		log.Printf("failed to read schema version: %v", err)
	}
	if version >= schemaVersion {
		return
	}
	if version < 1 {
		execSQLLog("INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (1, ?)", time.Now().UnixMilli())
		version = 1
	}
	if version < 2 {
		execSQLLog("ALTER TABLE users ADD COLUMN theme_color TEXT DEFAULT '#1976D2'")
		execSQLLog("ALTER TABLE users ADD COLUMN app_icon TEXT DEFAULT ''")
		execSQLLog("ALTER TABLE users ADD COLUMN salt TEXT DEFAULT ''")
		execSQLLog("CREATE INDEX IF NOT EXISTS idx_notes_username ON notes(username)")
		execSQLLog("CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)")
		execSQLLog("CREATE INDEX IF NOT EXISTS idx_trash_username ON trash(username)")
		execSQLLog("INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (2, ?)", time.Now().UnixMilli())
		version = 2
	}
	if version < 3 {
		execSQLLog("ALTER TABLE notes ADD COLUMN pin_order INTEGER DEFAULT 0")
		execSQLLog("ALTER TABLE trash ADD COLUMN pin_order INTEGER DEFAULT 0")
		execSQLLog("INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (3, ?)", time.Now().UnixMilli())
		version = 3
	}
	log.Printf("Schema migrated to v%d", version)
}

func initAdmin() {
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count); err != nil {
		log.Printf("failed to check admin existence: %v", err)
	}
	if count == 0 {
		salt := generateSalt()
		execSQLLog("INSERT INTO users (username, password, nickname, role, created_at, salt) VALUES (?, ?, ?, ?, ?, ?)",
			"admin", hashPassword("admin", salt), "Admin", "admin", time.Now().UnixMilli(), salt)
		log.Println("Admin user created: admin / admin")
		log.Println("⚠️  WARNING: Default admin credentials (admin/admin) are in use.")
		log.Println("⚠️  Change the password immediately via the admin panel for security.")
	}
}

const (
	// Current password hash version.
	// $1$salt$hash = HMAC-SHA256 × 200,000 (fallback, still accepted on verify)
	// $2$salt$hash = Argon2id (current, used for new registrations and upgrades)
	passwordHashVersion = "2"
	// Argon2id parameters
	argonTime    = 3
	argonMemory  = 64 * 1024 // 64 MB
	argonThreads = 4
	argonKeyLen  = 32
	// Fallback HMAC iteration count for version 1 hashes
	hashIterations       = 200000
	legacyHashIterations = 10000
)

func generateSalt() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func hashPassword(pwd, salt string) string {
	hash := argon2.IDKey([]byte(pwd), []byte(salt), argonTime, argonMemory, argonThreads, argonKeyLen)
	return "$2$" + salt + "$" + hex.EncodeToString(hash)
}

func hashHMAC(pwd, salt string, iterations int) string {
	key := []byte(salt)
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(pwd))
	b := mac.Sum(nil)
	for i := 0; i < iterations; i++ {
		mac.Reset()
		mac.Write(b)
		b = mac.Sum(nil)
	}
	return hex.EncodeToString(b)
}

// legacyHashPassword is the pre-v1.3.9 SHA256(password) — kept for migration.
func legacyHashPassword(pwd, salt string) string {
	h := sha256.Sum256([]byte(salt + pwd))
	return hex.EncodeToString(h[:])
}

func checkPassword(input, stored, salt string) bool {
	if !strings.HasPrefix(stored, "$") {
		// Legacy: plain hex — HMAC with 10,000 iterations
		return hashHMAC(input, salt, legacyHashIterations) == stored
	}
	parts := strings.SplitN(stored, "$", 4)
	if len(parts) < 4 {
		return false
	}
	switch parts[1] {
	case "1":
		// Version 1: HMAC-SHA256 × 200,000
		return hashHMAC(input, parts[2], hashIterations) == parts[3]
	case "2":
		// Version 2: Argon2id
		hash, err := hex.DecodeString(parts[3])
		if err != nil || len(hash) != argonKeyLen {
			return false
		}
		expected := argon2.IDKey([]byte(input), []byte(parts[2]), argonTime, argonMemory, argonThreads, argonKeyLen)
		return hmac.Equal(hash, expected)
	}
	return false
}

func upgradePasswordHash(pwd, storedHash string) (string, string) {
	// If already at latest version, no upgrade needed
	if strings.HasPrefix(storedHash, "$2$") {
		return "", ""
	}
	// Legacy or version 1: generate new salt and re-hash with Argon2id
	salt := generateSalt()
	return salt, hashPassword(pwd, salt)
}

func generateToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func verifyToken(r *http.Request) (string, bool) {
	token := r.Header.Get("Authorization")
	if strings.HasPrefix(token, "Bearer ") {
		token = token[7:]
	}
	if token == "" {
		return "", false
	}
	var username string
	err := db.QueryRow("SELECT username FROM auth_tokens WHERE token=?", token).Scan(&username)
	if err != nil {
		return "", false
	}
	return username, true
}

// requireRole verifies the request is authenticated and the user has the given role.
// If role is empty, it just checks authentication.
func requireRole(r *http.Request, role string) (string, bool) {
	username, valid := verifyToken(r)
	if !valid {
		return "", false
	}
	if role == "" {
		return username, true
	}
	var userRole string
	if err := db.QueryRow("SELECT role FROM users WHERE username=?", username).Scan(&userRole); err != nil {
		return "", false
	}
	if userRole != role {
		return "", false
	}
	return username, true
}

// requireAdmin is a shorthand for requireRole(r, "admin").
func requireAdmin(r *http.Request) (string, bool) {
	return requireRole(r, "admin")
}

// saveUploadedFile saves a file from a multipart form and returns its URL path.
func saveUploadedFile(w http.ResponseWriter, r *http.Request, fieldName string) (string, error) {
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		return "", fmt.Errorf("file too large")
	}
	defer r.MultipartForm.RemoveAll()
	file, header, err := r.FormFile(fieldName)
	if err != nil {
		return "", fmt.Errorf("file read failed")
	}
	defer file.Close()
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedUploadExts[ext] {
		return "", fmt.Errorf("unsupported format")
	}
	name := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	dir := uploadsDir()
	os.MkdirAll(dir, 0755)
	dst, err := os.Create(filepath.Join(dir, name))
	if err != nil {
		return "", fmt.Errorf("file write failed")
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("file write failed")
	}
	return "/uploads/" + name, nil
}

func cors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func securityHeaders(w http.ResponseWriter) {
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("Content-Security-Policy",
		"default-src 'self'; "+
			"script-src 'self'; "+
			"style-src 'self' 'unsafe-inline'; "+
			"img-src 'self' data: blob:; "+
			"font-src 'self' data:; "+
			"media-src 'self' blob:; "+
			"connect-src 'self' http: https: blob:; "+
			"worker-src 'self' blob:; "+
			"frame-ancestors 'none'; "+
			"form-action 'self'")
}

func jsonResp(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func errResp(w http.ResponseWriter, msg string, code int) {
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(errResponse{Error: msg})
}
