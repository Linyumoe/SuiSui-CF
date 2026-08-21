import { Hono } from "hono"
import { Env } from "./types"
import { err, json, parseJSON } from "./util"
import { requireAdmin, verifyToken } from "./auth"

// ── 系统设置 ─────────────────────────────────────────────────

export const settingsApp = new Hono<{ Bindings: Env }>()

settingsApp.get("/", async c => {
  const env = c.env
  const { results } = await env.DB.prepare("SELECT key, value FROM settings").all<{ key: string; value: string }>()
  const s: Record<string, string> = {
    site_title: "",
    allow_register: "true",
    site_favicon: "",
    site_icp: "",
    live_stream_url: "",
  }
  for (const row of results) s[row.key] = row.value
  return json(s)
})

settingsApp.post("/", async c => {
  const env = c.env
  const admin = await requireAdmin(env, c.req.raw)
  if (!admin) return err("forbidden", 403)
  const body = await parseJSON<{ key?: string; value?: string }>(c.req.raw, {})
  if (!body.key) return err("无效的请求数据", 400)
  await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind(body.key, body.value ?? "").run()
  return json({ success: "ok" })
})

// ── 管理后台 ─────────────────────────────────────────────────

export const adminApp = new Hono<{ Bindings: Env }>()

adminApp.get("/stats", async c => {
  const env = c.env
  if (!(await requireAdmin(env, c.req.raw))) return err("forbidden", 403)
  const users = await env.DB.prepare("SELECT COUNT(*) AS c FROM users").first<{ c: number }>()
  const notes = await env.DB.prepare("SELECT COUNT(*) AS c FROM notes").first<{ c: number }>()
  return json({ totalUsers: users?.c ?? 0, totalNotes: notes?.c ?? 0 })
})

adminApp.get("/users", async c => {
  const env = c.env
  if (!(await requireAdmin(env, c.req.raw))) return err("forbidden", 403)
  let page = 1
  let perPage = 10
  const p = Number(c.req.query("page"))
  if (Number.isInteger(p) && p > 0) page = p
  const pp = Number(c.req.query("per_page"))
  if (Number.isInteger(pp) && pp > 0) perPage = pp
  const offset = (page - 1) * perPage

  const totalRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM users").first<{ c: number }>()
  const total = totalRow?.c ?? 0

  const { results } = await env.DB.prepare(
    `SELECT u.id, u.username, u.nickname, u.avatar, u.role, u.created_at, COUNT(n.id) AS memo_count
     FROM users u LEFT JOIN notes n ON n.username = u.username
     GROUP BY u.id ORDER BY u.id LIMIT ? OFFSET ?`,
  ).bind(perPage, offset).all<{ id: number; username: string; nickname: string; avatar: string; role: string; created_at: number; memo_count: number }>()

  const users = results.map(u => ({
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    avatar: u.avatar,
    role: u.role,
    createdAt: u.created_at,
    memoCount: u.memo_count,
  }))
  return json({ users, total, page, perPage })
})

adminApp.get("/config", async c => {
  const env = c.env
  if (!(await requireAdmin(env, c.req.raw))) return err("unauthorized", 401)
  return json({
    version: env.VERSION ?? "cf",
    port: "cloudflare",
    tls: true,
    dataDir: "D1",
  })
})

adminApp.delete("/users/:id", async c => {
  const env = c.env
  if (!(await requireAdmin(env, c.req.raw))) return err("forbidden", 403)
  const id = c.req.param("id")
  const user = await env.DB.prepare("SELECT username FROM users WHERE id = ?").bind(id).first<{ username: string }>()
  if (!user) return err("用户不存在", 404)
  await env.DB.prepare("DELETE FROM notes WHERE username = ?").bind(user.username).run()
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run()
  return json({ success: "ok" })
})

// ── 分享视图 ─────────────────────────────────────────────────

export const shareApp = new Hono<{ Bindings: Env }>()

shareApp.get("/:id", async c => {
  const env = c.env
  const id = c.req.param("id")
  const row = await env.DB.prepare(
    "SELECT id, content, created_at, updated_at, pinned, tags, username, avatar, nickname FROM notes WHERE id = ?",
  ).bind(id).first()
  if (!row) return err("笔记不存在", 404)
  let tags: string[] = []
  try {
    tags = JSON.parse((row as { tags: string }).tags)
  } catch {
    tags = []
  }
  const reactions = await (async () => {
    const { results } = await env.DB.prepare("SELECT emoji, username FROM reactions WHERE id = ?").bind(id).all<{ emoji: string; username: string }>()
    const map: Record<string, string[]> = {}
    for (const r of results) {
      if (!map[r.emoji]) map[r.emoji] = []
      map[r.emoji].push(r.username)
    }
    return map
  })()
  return json({
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pinned: (row as { pinned: number }).pinned === 1,
    tags,
    username: row.username,
    avatar: row.avatar,
    nickname: row.nickname,
    reactions,
  })
})
