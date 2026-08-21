import { Hono } from "hono"
import { Env } from "./types"
import { err, json, parseJSON, generateToken } from "./util"
import { hashPassword, checkPassword, generateSalt } from "./crypto"

/**
 * 密码哈希：PBKDF2-SHA256（见 crypto.ts）
 * 使用 Web Crypto 原生实现，无需 WASM 依赖。
 */

/** 从 Authorization: Bearer 头解析 token 并查库，返回用户名 */
export async function verifyToken(env: Env, request: Request): Promise<string | null> {
  const auth = request.headers.get("Authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token) return null
  const row = await env.DB.prepare("SELECT username FROM auth_tokens WHERE token = ?").bind(token).first<{ username: string }>()
  return row?.username ?? null
}

/**
 * 校验认证与角色。
 * role 为空时仅校验已登录；否则校验用户角色匹配。
 */
export async function requireRole(env: Env, request: Request, role = ""): Promise<string | null> {
  const username = await verifyToken(env, request)
  if (!username) return null
  if (!role) return username
  const row = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(username).first<{ role: string }>()
  if (!row || row.role !== role) return null
  return username
}

export const requireAdmin = (env: Env, request: Request) => requireRole(env, request, "admin")

// ── 登录限流（按 IP，5 次/分钟）──────────────────────────────

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60_000

async function checkLoginRateLimit(env: Env, ip: string): Promise<boolean> {
  const now = Date.now()
  const row = await env.DB.prepare("SELECT count, last_time FROM login_attempts WHERE ip = ?").bind(ip).first<{ count: number; last_time: number }>()
  if (!row || now - row.last_time > RATE_LIMIT_WINDOW_MS) {
    await env.DB.prepare("INSERT OR REPLACE INTO login_attempts (ip, count, last_time) VALUES (?, 1, ?)").bind(ip, now).run()
    return true
  }
  if (row.count >= RATE_LIMIT_MAX) return false
  await env.DB.prepare("UPDATE login_attempts SET count = count + 1, last_time = ? WHERE ip = ?").bind(now, ip).run()
  return true
}

async function resetLoginRateLimit(env: Env, ip: string): Promise<void> {
  await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run()
}

function clientIP(request: Request): string {
  const cf = (request as Request & { cf?: { connectingIp?: string } }).cf
  const ip = cf?.connectingIp ?? request.headers.get("CF-Connecting-IP") ?? "unknown"
  return ip
}

/** 首次使用时惰性创建默认管理员 admin/admin */
let adminInitPromise: Promise<void> | null = null
export function ensureAdmin(env: Env): Promise<void> {
  if (!adminInitPromise) {
    adminInitPromise = (async () => {
      const row = await env.DB.prepare("SELECT COUNT(*) AS c FROM users").first<{ c: number }>()
      if (row && row.c > 0) return
      const salt = generateSalt()
      const pwd = await hashPassword("admin", salt)
      await env.DB.prepare(
        "INSERT INTO users (username, password, nickname, role, created_at, salt) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind("admin", pwd, "Admin", "admin", Date.now(), salt).run()
      console.log("Admin user created: admin / admin (please change the password immediately)")
    })().catch(err => {
      adminInitPromise = null // 失败可重试
      throw err
    })
  }
  return adminInitPromise
}

// ── 认证路由 ─────────────────────────────────────────────────

export const authApp = new Hono<{ Bindings: Env }>()

authApp.post("/login", async c => {
  const env = c.env
  let body: { username?: string; password?: string }
  try {
    body = await c.req.json()
  } catch {
    return err("无效的请求数据", 400)
  }
  const username = (body.username ?? "").trim()
  const password = body.password ?? ""
  const ip = clientIP(c.req.raw)
  if (!(await checkLoginRateLimit(env, ip))) {
    return err("登录尝试过于频繁，请稍后再试", 429)
  }
  const user = await env.DB.prepare("SELECT password, role, salt, avatar, nickname, theme_color FROM users WHERE username = ?")
    .bind(username).first<{ password: string; role: string; salt: string; avatar: string; nickname: string; theme_color: string }>()
  if (!user || !(await checkPassword(password, user.password, user.salt))) {
    return err("用户名或密码错误", 401)
  }
  await resetLoginRateLimit(env, ip)
  const token = generateToken()
  await env.DB.prepare("INSERT INTO auth_tokens (token, username, created_at) VALUES (?, ?, ?)")
    .bind(token, username, Date.now()).run()
  return json({
    username,
    avatar: user.avatar,
    nickname: user.nickname,
    role: user.role,
    theme_color: user.theme_color,
    token,
  })
})

authApp.post("/register", async c => {
  const env = c.env
  let body: { username?: string; password?: string }
  try {
    body = await c.req.json()
  } catch {
    return err("无效的请求数据", 400)
  }
  const username = (body.username ?? "").trim()
  const password = body.password ?? ""
  if (username.length < 2 || password.length < 4) {
    return err("用户名至少2个字符，密码至少4个字符", 400)
  }
  const setting = await env.DB.prepare("SELECT value FROM settings WHERE key = 'allow_register'").first<{ value: string }>()
  if (setting?.value === "false") {
    return err("注册已关闭", 403)
  }
  const salt = generateSalt()
  const pwd = await hashPassword(password, salt)
  try {
    await env.DB.prepare("INSERT INTO users (username, password, role, created_at, salt) VALUES (?, ?, ?, ?, ?)")
      .bind(username, pwd, "user", Date.now(), salt).run()
  } catch {
    return err("用户已存在", 409)
  }
  const token = generateToken()
  await env.DB.prepare("INSERT INTO auth_tokens (token, username, created_at) VALUES (?, ?, ?)")
    .bind(token, username, Date.now()).run()
  return json({ username, role: "user", token })
})

authApp.get("/verify", async c => {
  const env = c.env
  const username = c.req.query("username") ?? ""
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser || tokenUser !== username) {
    return json({ valid: false })
  }
  const user = await env.DB.prepare("SELECT avatar, nickname, role, theme_color FROM users WHERE username = ?")
    .bind(username).first<{ avatar: string; nickname: string; role: string; theme_color: string }>()
  if (!user) return json({ valid: false })
  return json({ valid: true, avatar: user.avatar, nickname: user.nickname, role: user.role, theme_color: user.theme_color })
})

authApp.patch("/avatar", async c => {
  const env = c.env
  const body = await parseJSON<{ username?: string; avatar?: string }>(c.req.raw, {})
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser || tokenUser !== body.username) return err("unauthorized", 401)
  await env.DB.prepare("UPDATE users SET avatar = ? WHERE username = ?").bind(body.avatar ?? "", body.username).run()
  await env.DB.prepare("UPDATE notes SET avatar = ? WHERE username = ?").bind(body.avatar ?? "", body.username).run()
  await env.DB.prepare("UPDATE trash SET avatar = ? WHERE username = ?").bind(body.avatar ?? "", body.username).run()
  return json({ success: "ok" })
})

authApp.patch("/nickname", async c => {
  const env = c.env
  const body = await parseJSON<{ username?: string; nickname?: string }>(c.req.raw, {})
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser || tokenUser !== body.username) return err("unauthorized", 401)
  const nickname = (body.nickname ?? "").trim()
  const dup = await env.DB.prepare("SELECT COUNT(*) AS c FROM users WHERE nickname = ? AND username != ?")
    .bind(nickname, body.username).first<{ c: number }>()
  if (dup && dup.c > 0) return err("昵称已存在", 409)
  await env.DB.prepare("UPDATE users SET nickname = ? WHERE username = ?").bind(nickname, body.username).run()
  await env.DB.prepare("UPDATE notes SET nickname = ? WHERE username = ?").bind(nickname, body.username).run()
  await env.DB.prepare("UPDATE trash SET nickname = ? WHERE username = ?").bind(nickname, body.username).run()
  return json({ success: true, nickname })
})

authApp.patch("/app-icon", async c => {
  const env = c.env
  const body = await parseJSON<{ username?: string; appIcon?: string }>(c.req.raw, {})
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser || tokenUser !== body.username) return err("unauthorized", 401)
  await env.DB.prepare("UPDATE users SET app_icon = ? WHERE username = ?").bind(body.appIcon ?? "", body.username).run()
  return json({ success: "ok" })
})

authApp.patch("/theme", async c => {
  const env = c.env
  const body = await parseJSON<{ username?: string; theme?: string }>(c.req.raw, {})
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser || tokenUser !== body.username) return err("unauthorized", 401)
  await env.DB.prepare("UPDATE users SET theme_color = ? WHERE username = ?").bind(body.theme ?? "", body.username).run()
  return json({ success: "ok" })
})

authApp.patch("/password", async c => {
  const env = c.env
  const body = await parseJSON<{ username?: string; oldPassword?: string; newPassword?: string }>(c.req.raw, {})
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser || tokenUser !== body.username) return err("unauthorized", 401)
  const user = await env.DB.prepare("SELECT password, salt FROM users WHERE username = ?")
    .bind(body.username).first<{ password: string; salt: string }>()
  if (!user) return err("用户不存在", 404)
  if (!(await checkPassword(body.oldPassword ?? "", user.password, user.salt))) {
    return err("密码验证失败", 401)
  }
  if ((body.newPassword ?? "").length < 4) {
    return err("新密码至少4个字符", 400)
  }
  const salt = generateSalt()
  const pwd = await hashPassword(body.newPassword!, salt)
  await env.DB.prepare("UPDATE users SET password = ?, salt = ? WHERE username = ?").bind(pwd, salt, body.username).run()
  return json({ success: "ok" })
})
