package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"
)

func handleAuth(w http.ResponseWriter, r *http.Request, path string) {
	switch {
	case path == "/auth/login" && r.Method == "POST":
		var body struct{ Username, Password string }
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "无效的请求数据", 400)
			return
		}
		// Rate limit: use RemoteAddr (strip port) to prevent IP spoofing
		ip := r.RemoteAddr
		if idx := strings.LastIndex(ip, ":"); idx >= 0 {
			ip = ip[:idx]
		}
		if !checkLoginRateLimit(ip) {
			errResp(w, "登录尝试过于频繁，请稍后再试", 429)
			return
		}
		var storedPwd, role, salt string
		err := db.QueryRow("SELECT password, role, salt FROM users WHERE username=?", body.Username).Scan(&storedPwd, &role, &salt)
		if err != nil {
			errResp(w, "用户名或密码错误", 401)
			return
		}
		if !checkPassword(body.Password, storedPwd, salt) {
			// Fallback: legacy SHA256 hashing (pre-v1.3.9)
			if legacyHashPassword(body.Password, salt) != storedPwd {
				errResp(w, "用户名或密码错误", 401)
				return
			}
			// Upgrade SHA256 → versioned HMAC
			newSalt, newHash := upgradePasswordHash(body.Password, storedPwd)
			execSQLLog("UPDATE users SET password=?, salt=? WHERE username=?", newHash, newSalt, body.Username)
			log.Printf("upgraded password hash (sha256→v1) for user %s", body.Username)
		} else if !strings.HasPrefix(storedPwd, "$") {
			// Upgrade legacy HMAC → versioned HMAC with higher iterations
			newSalt, newHash := upgradePasswordHash(body.Password, storedPwd)
			execSQLLog("UPDATE users SET password=?, salt=? WHERE username=?", newHash, newSalt, body.Username)
			log.Printf("upgraded password hash (v0→v1) for user %s", body.Username)
		}
		var avatar, nickname string
		var themeColor string
		if err := db.QueryRow("SELECT avatar, nickname, theme_color FROM users WHERE username=?", body.Username).Scan(&avatar, &nickname, &themeColor); err != nil {
			log.Printf("failed to query user profile: %v", err)
		}
		resetLoginRateLimit(ip)
		token := generateToken()
		if _, err := db.Exec("INSERT INTO auth_tokens (token, username, created_at) VALUES (?, ?, ?)", token, body.Username, time.Now().UnixMilli()); err != nil {
			errResp(w, "登录失败，请重试", 500)
			return
		}
		jsonResp(w, authLoginResponse{Username: body.Username, Avatar: avatar, Nickname: nickname, Role: role, ThemeColor: themeColor, Token: token})

	case path == "/auth/register" && r.Method == "POST":
		var body struct{ Username, Password string }
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "无效的请求数据", 400)
			return
		}
		if len(body.Username) < 2 || len(body.Password) < 4 {
			errResp(w, "用户名至少2个字符，密码至少4个字符", 400)
			return
		}
		var allowReg string
		if err := db.QueryRow("SELECT value FROM settings WHERE key='allow_register'").Scan(&allowReg); err != nil {
			log.Printf("failed to read allow_register setting: %v", err)
		}
		if allowReg == "false" {
			errResp(w, "注册已关闭", 403)
			return
		}
		regSalt := generateSalt()
		_, err := db.Exec("INSERT INTO users (username, password, role, created_at, salt) VALUES (?, ?, ?, ?, ?)",
			body.Username, hashPassword(body.Password, regSalt), "user", time.Now().UnixMilli(), regSalt)
		if err != nil {
			errResp(w, "用户已存在", 409)
			return
		}
		regToken := generateToken()
		if _, err := db.Exec("INSERT INTO auth_tokens (token, username, created_at) VALUES (?, ?, ?)", regToken, body.Username, time.Now().UnixMilli()); err != nil {
			errResp(w, "注册失败，请重试", 500)
			return
		}
		jsonResp(w, authRegisterResponse{Username: body.Username, Role: "user", Token: regToken})

	case path == "/auth/verify" && r.Method == "GET":
		username := r.URL.Query().Get("username")
		tokenUser, tokenValid := verifyToken(r)
		if !tokenValid || tokenUser != username {
			jsonResp(w, authVerifyResponse{Valid: false})
			return
		}
		var avatar, nickname, role, themeColor string
		err := db.QueryRow("SELECT avatar, nickname, role, theme_color FROM users WHERE username=?", username).Scan(&avatar, &nickname, &role, &themeColor)
		if err != nil {
			jsonResp(w, authVerifyResponse{Valid: false})
			return
		}
		jsonResp(w, authVerifyResponse{Valid: true, Avatar: avatar, Nickname: nickname, Role: role, ThemeColor: themeColor})

	case path == "/auth/avatar" && r.Method == "PATCH":
		var body struct{ Username, Avatar string }
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "无效的请求数据", 400)
			return
		}
		tokenUser, tokenValid := verifyToken(r)
		if !tokenValid || tokenUser != body.Username {
			errResp(w, "unauthorized", 401)
			return
		}
		if _, err := db.Exec("UPDATE users SET avatar=? WHERE username=?", body.Avatar, body.Username); err != nil {
			errResp(w, "头像更新失败", 500)
			return
		}
		execSQLLog("UPDATE notes SET avatar=? WHERE username=?", body.Avatar, body.Username)
		execSQLLog("UPDATE trash SET avatar=? WHERE username=?", body.Avatar, body.Username)
		jsonResp(w, successResponse{Success: "ok"})

	case path == "/auth/nickname" && r.Method == "PATCH":
		var body struct{ Username, Nickname string }
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "无效的请求数据", 400)
			return
		}
		tokenUser, tokenValid := verifyToken(r)
		if !tokenValid || tokenUser != body.Username {
			errResp(w, "unauthorized", 401)
			return
		}
		var count int
		if err := db.QueryRow("SELECT COUNT(*) FROM users WHERE nickname=? AND username!=?", body.Nickname, body.Username).Scan(&count); err != nil {
			log.Printf("nickname uniqueness check failed: %v", err)
		}
		if count > 0 {
			errResp(w, "昵称已存在", 409)
			return
		}
		if _, err := db.Exec("UPDATE users SET nickname=? WHERE username=?", body.Nickname, body.Username); err != nil {
			errResp(w, "昵称更新失败", 500)
			return
		}
		execSQLLog("UPDATE notes SET nickname=? WHERE username=?", body.Nickname, body.Username)
		execSQLLog("UPDATE trash SET nickname=? WHERE username=?", body.Nickname, body.Username)
		jsonResp(w, authSuccessResponse{Success: true, Nickname: body.Nickname})

	case path == "/auth/app-icon" && r.Method == "PATCH":
		var body struct{ Username, AppIcon string }
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "无效的请求数据", 400)
			return
		}
		tokenUser, tokenValid := verifyToken(r)
		if !tokenValid || tokenUser != body.Username {
			errResp(w, "unauthorized", 401)
			return
		}
		if _, err := db.Exec("UPDATE users SET app_icon=? WHERE username=?", body.AppIcon, body.Username); err != nil {
			errResp(w, "图标更新失败", 500)
			return
		}
		jsonResp(w, successResponse{Success: "ok"})

	case path == "/auth/theme" && r.Method == "PATCH":
		var body struct{ Username, Theme string }
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "无效的请求数据", 400)
			return
		}
		tokenUser, tokenValid := verifyToken(r)
		if !tokenValid || tokenUser != body.Username {
			errResp(w, "unauthorized", 401)
			return
		}
		if _, err := db.Exec("UPDATE users SET theme_color=? WHERE username=?", body.Theme, body.Username); err != nil {
			errResp(w, "主题色更新失败", 500)
			return
		}
		jsonResp(w, successResponse{Success: "ok"})

	case path == "/auth/password" && r.Method == "PATCH":
		var body struct{ Username, OldPassword, NewPassword string }
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			errResp(w, "无效的请求数据", 400)
			return
		}
		tokenUser, tokenValid := verifyToken(r)
		if !tokenValid || tokenUser != body.Username {
			errResp(w, "unauthorized", 401)
			return
		}
		var storedPwd, salt string
		if err := db.QueryRow("SELECT password, salt FROM users WHERE username=?", body.Username).Scan(&storedPwd, &salt); err != nil {
			errResp(w, "用户不存在", 404)
			return
		}
		if !checkPassword(body.OldPassword, storedPwd, salt) {
			errResp(w, "密码验证失败", 401)
			return
		}
		if len(body.NewPassword) < 4 {
			errResp(w, "新密码至少4个字符", 400)
			return
		}
		newSalt := generateSalt()
		if _, err := db.Exec("UPDATE users SET password=?, salt=? WHERE username=?", hashPassword(body.NewPassword, newSalt), newSalt, body.Username); err != nil {
			errResp(w, "密码修改失败", 500)
			return
		}
		jsonResp(w, successResponse{Success: "ok"})

	case path == "/auth/avatar/upload" && r.Method == "POST":
		_, tokenValid := verifyToken(r)
		if !tokenValid {
			errResp(w, "unauthorized", 401)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
		url, err := saveUploadedFile(w, r, "avatar")
		if err != nil {
			errResp(w, "不支持的文件格式", 400)
			return
		}
		jsonResp(w, uploadResponse{Success: true, URL: url})
	}
}
