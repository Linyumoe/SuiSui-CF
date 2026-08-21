package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

// Version is set at build time via -ldflags, fallback to "dev" in local builds.
var Version = "dev"
var serverPort = "3742"
var githubToken = ""

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3742"
	}
	githubToken = os.Getenv("GITHUB_TOKEN")
	dataDir = "."

	for i := 1; i < len(os.Args); i++ {
		switch os.Args[i] {
		case "-port":
			if i+1 < len(os.Args) {
				port = os.Args[i+1]
				i++
			}
		case "-data":
			if i+1 < len(os.Args) {
				dataDir = os.Args[i+1]
				i++
			}
		}
	}

	initDB()
	initAdmin()

	go startLoginRateLimitCleanup()

	serverPort = port

	mux := http.NewServeMux()
	mux.HandleFunc("/api/", handleAPI)
	mux.HandleFunc("/uploads/", handleUploads)
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/", handleStatic)

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      loggingMiddleware(mux),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Server %s on :%s (data: %s)", Version, port, dataDir)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("listen error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("shutdown error: %v", err)
	}
	log.Println("Server stopped")
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	var dbVer int
	err := db.QueryRow("SELECT COALESCE(MAX(version), 0) FROM schema_version").Scan(&dbVer)
	if err != nil {
		jsonResp(w, healthResponse{Status: "error", Message: err.Error()})
		return
	}
	jsonResp(w, healthResponse{Status: "ok", DBSchemaVersion: dbVer, Version: Version})
}

func handleAPI(w http.ResponseWriter, r *http.Request) {
	cors(w)
	securityHeaders(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(200)
		return
	}
	path := strings.TrimPrefix(r.URL.Path, "/api")
	switch {
	case strings.HasPrefix(path, "/gh/"):
		handleGitHubProxy(w, r)
	case strings.HasPrefix(path, "/auth/"):
		handleAuth(w, r, path)
	case strings.HasPrefix(path, "/notes"):
		if path == "/notes/export" {
			handleNotesExport(w, r)
			return
		}
		if path == "/notes/import" {
			handleNotesImport(w, r)
			return
		}
		if strings.HasSuffix(path, "/restore") || strings.HasSuffix(path, "/hard-delete") || path == "/notes/trash" {
			handleTrash(w, r, path)
			return
		}
		handleNotes(w, r, path)
	case strings.HasPrefix(path, "/share/"):
		handleShareView(w, r)

	case strings.HasPrefix(path, "/settings"):
		handleSettings(w, r)
	case strings.HasPrefix(path, "/events"):
		sseHandler(w, r)
	case path == "/admin/config":
		// Require admin auth before exposing server config
		if _, ok := requireAdmin(r); !ok {
			errResp(w, "unauthorized", 401)
			return
		}
		jsonResp(w, map[string]interface{}{
			"version": Version,
			"port":    serverPort,
			"dataDir": dataDir,
		})
	case strings.HasPrefix(path, "/admin/"):
		handleAdmin(w, r, path)
	default:
		errResp(w, "not found", 404)
	}
}

func handleUploads(w http.ResponseWriter, r *http.Request) {
	filePath := strings.TrimPrefix(r.URL.Path, "/uploads/")
	if strings.Contains(filePath, "..") || strings.Contains(filePath, "/") || strings.Contains(filePath, "\\") {
		errResp(w, "invalid path", 400)
		return
	}
	ext := strings.ToLower(filepath.Ext(filePath))
	if !allowedUploadExts[ext] {
		http.NotFound(w, r)
		return
	}
	fullPath := filepath.Join(uploadsDir(), filePath)
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("X-Content-Type-Options", "nosniff")
	contentType := map[string]string{".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
		".gif": "image/gif", ".webp": "image/webp", ".ico": "image/x-icon", ".bmp": "image/bmp"}[ext]
	if contentType != "" {
		w.Header().Set("Content-Type", contentType)
	}
	w.Header().Set("Cache-Control", "public, max-age=604800")
	http.ServeFile(w, r, fullPath)
}

func handleGitHubProxy(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/gh/")
	if path == "" {
		errResp(w, "missing path", 400)
		return
	}
	token := githubToken
	ghURL := "https://api.github.com/" + path
	req, err := http.NewRequest("GET", ghURL, nil)
	if err != nil {
		log.Printf("failed to create GitHub request: %v", err)
		errResp(w, "invalid request", 400)
		return
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		errResp(w, "proxy error", 502)
		return
	}
	defer resp.Body.Close()
	for k, v := range resp.Header {
		if k == "Content-Type" || k == "Content-Length" {
			w.Header()[k] = v
		}
	}
	w.WriteHeader(resp.StatusCode)
	if _, err := io.Copy(w, resp.Body); err != nil {
		log.Printf("proxy copy error: %v", err)
	}
}

// handleAdminConfig returns server config for authenticated admins.
func handleAdminConfig(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireAdmin(r); !ok {
		errResp(w, "unauthorized", 401)
		return
	}
	jsonResp(w, map[string]interface{}{
		"version": Version,
		"port":    serverPort,
		"dataDir": dataDir,
	})
}


