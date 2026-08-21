import { Hono } from "hono"
import { Env, NoteRow, TrashRow, NoteJSON, allowedUploadExts, MAX_UPLOAD_BYTES, MAX_NOTE_CONTENT } from "./types"
import { err, json, parseJSON } from "./util"
import { requireRole, verifyToken } from "./auth"

// ── 查询构建 ─────────────────────────────────────────────────

interface NotesParams {
  search?: string
  tag?: string
  date?: string
  username?: string
}

function buildWhere(params: NotesParams): { where: string; args: string[] } {
  const clauses: string[] = ["1=1"]
  const args: string[] = []
  if (params.search) {
    clauses.push("content LIKE ?")
    args.push(`%${params.search}%`)
  }
  if (params.tag) {
    clauses.push("tags LIKE ?")
    args.push(`%"${params.tag}"%`)
  }
  if (params.date) {
    clauses.push("strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') = ?")
    args.push(params.date)
  }
  if (params.username) {
    clauses.push("username = ?")
    args.push(params.username)
  }
  return { where: clauses.join(" AND "), args }
}

const ORDER_BY = "ORDER BY pinned DESC, CASE WHEN pinned=1 THEN pin_order ELSE 0 END ASC, created_at DESC"
const SELECT_COLS = "id, content, created_at, updated_at, pinned, tags, username, avatar, nickname"

function rowToNote(row: NoteRow): NoteJSON {
  let tags: string[] = []
  try {
    tags = JSON.parse(row.tags)
  } catch {
    tags = []
  }
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pinned: row.pinned === 1,
    tags,
    username: row.username,
    avatar: row.avatar,
    nickname: row.nickname,
  }
}

// ── Reactions ────────────────────────────────────────────────

async function batchGetReactions(env: Env, ids: string[]): Promise<Record<string, Record<string, string[]>>> {
  if (ids.length === 0) return {}
  const placeholders = ids.map(() => "?").join(",")
  const { results } = await env.DB.prepare(
    `SELECT id, emoji, username FROM reactions WHERE id IN (${placeholders})`,
  ).bind(...ids).all<{ id: string; emoji: string; username: string }>()
  const map: Record<string, Record<string, string[]>> = {}
  for (const r of results) {
    if (!map[r.id]) map[r.id] = {}
    if (!map[r.id][r.emoji]) map[r.id][r.emoji] = []
    map[r.id][r.emoji].push(r.username)
  }
  return map
}

async function attachReactions(env: Env, notes: NoteJSON[]): Promise<void> {
  const map = await batchGetReactions(env, notes.map(n => n.id))
  for (const n of notes) {
    n.reactions = map[n.id] ?? {}
  }
}

// ── 笔记路由 ─────────────────────────────────────────────────

export const notesApp = new Hono<{ Bindings: Env }>()

notesApp.get("/", async c => {
  const env = c.env
  const q = c.req.query()
  let limit = 0
  let offset = 0
  if (q.limit !== undefined) {
    const n = Number(q.limit)
    if (Number.isInteger(n) && n > 0) limit = Math.min(n, 200)
  }
  if (q.offset !== undefined) {
    const n = Number(q.offset)
    if (Number.isInteger(n) && n > 0) offset = n
  }

  const { where, args } = buildWhere({
    search: q.search,
    tag: q.tag,
    date: q.date,
    username: q.username,
  })

  const countRow = await env.DB.prepare(`SELECT COUNT(*) AS c FROM notes WHERE ${where}`).bind(...args).first<{ c: number }>()
  const total = countRow?.c ?? 0

  let sql = `SELECT ${SELECT_COLS} FROM notes WHERE ${where} ${ORDER_BY}`
  const dataArgs: string[] = [...args]
  if (limit > 0) {
    sql += " LIMIT ?"
    dataArgs.push(String(limit))
    if (offset > 0) {
      sql += " OFFSET ?"
      dataArgs.push(String(offset))
    }
  }
  const { results } = await env.DB.prepare(sql).bind(...dataArgs).all<NoteRow>()
  const notes = results.map(rowToNote)
  await attachReactions(env, notes)

  if (limit > 0) {
    return json({ notes, total, limit, offset })
  }
  return json(notes)
})

notesApp.post("/", async c => {
  const env = c.env
  const requester = await requireRole(env, c.req.raw)
  if (!requester) return err("unauthorized", 401)
  const body = await parseJSON<NoteJSON>(c.req.raw, null as unknown as NoteJSON)
  if (!body) return err("无效的请求数据", 400)
  if (body.content.length > MAX_NOTE_CONTENT) return err("内容过长（上限 50000 字符）", 400)
  if ((body.username ?? "").length > 50) return err("用户名过长", 400)
  if (!body.username || body.username !== requester) return err("unauthorized", 401)
  await env.DB.prepare(
    "INSERT INTO notes (id, content, created_at, updated_at, pinned, tags, username, avatar, nickname) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)",
  ).bind(
    body.id, body.content, body.createdAt, body.updatedAt,
    JSON.stringify(body.tags ?? []), body.username, body.avatar ?? "", body.nickname ?? "",
  ).run()
  return json({ success: "ok" })
})

notesApp.post("/upload", async c => {
  const env = c.env
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser) return err("unauthorized", 401)
  const form = await c.req.formData().catch(() => null)
  const file = form?.get("image")
  if (!(file instanceof File)) return err("不支持的文件格式", 400)
  if (file.size > MAX_UPLOAD_BYTES) return err("file too large", 400)
  const name = file.name.toLowerCase()
  const dot = name.lastIndexOf(".")
  const ext = dot >= 0 ? name.slice(dot) : ""
  if (!allowedUploadExts.has(ext)) return err("不支持的文件格式", 400)
  const key = `${Date.now()}${ext}`
  await env.UPLOADS.put(key, await file.arrayBuffer(), {
    metadata: { contentType: file.type || "application/octet-stream" },
  })
  return json({ success: true, url: "/uploads/" + key })
})

notesApp.post("/import", async c => {
  const env = c.env
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser) return err("unauthorized", 401)
  const notes = await parseJSON<NoteJSON[]>(c.req.raw, [])
  if (!Array.isArray(notes)) return err("无效的请求数据", 400)
  let imported = 0
  for (const n of notes) {
    if (!n || n.username !== tokenUser) continue
    const pinned = n.pinned ? 1 : 0
    const res = await env.DB.prepare(
      "INSERT OR IGNORE INTO notes (id, content, created_at, updated_at, pinned, tags, username, avatar, nickname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      n.id, n.content, n.createdAt, n.updatedAt, pinned,
      JSON.stringify(n.tags ?? []), n.username, n.avatar ?? "", n.nickname ?? "",
    ).run()
    if (res.meta.changes > 0) imported++
  }
  return json({ imported })
})

notesApp.get("/export", async c => {
  const env = c.env
  const username = c.req.query("username") ?? ""
  if (!username) return err("username required", 400)
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser || tokenUser !== username) return err("unauthorized", 401)
  const { results } = await env.DB.prepare(
    `SELECT ${SELECT_COLS} FROM notes WHERE username = ? ORDER BY created_at DESC`,
  ).bind(username).all<NoteRow>()
  const notes = results.map(rowToNote)
  await attachReactions(env, notes)
  const data = JSON.stringify(notes, null, 2)
  return new Response(data, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="suisui-notes-${username}.json"`,
    },
  })
})

notesApp.get("/trash", async c => {
  const env = c.env
  const username = c.req.query("username") ?? ""
  if (!username) return err("username required", 400)
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser || tokenUser !== username) return err("unauthorized", 401)
  let limit = 50
  let offset = 0
  const l = Number(c.req.query("limit"))
  if (Number.isInteger(l) && l >= 0) limit = l
  const o = Number(c.req.query("offset"))
  if (Number.isInteger(o) && o >= 0) offset = o
  const { results } = await env.DB.prepare(
    "SELECT id, content, created_at, updated_at, pinned, tags, username, avatar, nickname, deleted_at FROM trash WHERE username = ? ORDER BY deleted_at DESC LIMIT ? OFFSET ?",
  ).bind(username, limit, offset).all<TrashRow & { deleted_at: number }>()
  const items = results.map(t => {
    let tags: string[] = []
    try {
      tags = JSON.parse(t.tags)
    } catch {
      tags = []
    }
    return {
      id: t.id,
      content: t.content,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      pinned: t.pinned === 1,
      tags,
      username: t.username,
      avatar: t.avatar,
      nickname: t.nickname,
      deletedAt: t.deleted_at,
    }
  })
  return json(items)
})

notesApp.patch("/reorder", async c => {
  const env = c.env
  const requester = await requireRole(env, c.req.raw)
  if (!requester) return err("unauthorized", 401)
  const body = await parseJSON<{ order?: string[] }>(c.req.raw, {})
  const order = body.order ?? []
  await env.DB.batch(
    order.map((id, i) =>
      env.DB.prepare("UPDATE notes SET pin_order = ? WHERE id = ? AND username = ?").bind(i, id, requester),
    ),
  )
  return json({ success: "ok" })
})

// ── /notes/:id 及子路由 ──────────────────────────────────────

notesApp.post("/:id/react", async c => {
  const env = c.env
  const id = c.req.param("id")
  const body = await parseJSON<{ emoji?: string; username?: string }>(c.req.raw, {})
  const emoji = body.emoji ?? ""
  const username = body.username ?? ""
  if (!emoji || !username) return err("invalid request", 400)
  if (!username.startsWith("guest_")) {
    const tokenUser = await verifyToken(env, c.req.raw)
    if (!tokenUser || username !== tokenUser) return err("unauthorized", 401)
  }
  const note = await env.DB.prepare("SELECT username FROM notes WHERE id = ?").bind(id).first<{ username: string }>()
  if (!note) return err("笔记不存在", 404)
  if (!username.startsWith("guest_") && note.username !== username) return err("forbidden", 403)
  await env.DB.prepare("INSERT OR IGNORE INTO reactions (id, emoji, username) VALUES (?, ?, ?)")
    .bind(id, emoji, username).run()
  return json({ success: "ok" })
})

notesApp.delete("/:id/react", async c => {
  const env = c.env
  const id = c.req.param("id")
  const body = await parseJSON<{ emoji?: string; username?: string }>(c.req.raw, {})
  const emoji = body.emoji ?? ""
  const username = body.username ?? ""
  if (!emoji || !username) return err("invalid request", 400)
  if (!username.startsWith("guest_")) {
    const tokenUser = await verifyToken(env, c.req.raw)
    if (!tokenUser || username !== tokenUser) return err("unauthorized", 401)
  }
  const note = await env.DB.prepare("SELECT username FROM notes WHERE id = ?").bind(id).first<{ username: string }>()
  if (!note) return err("笔记不存在", 404)
  if (!username.startsWith("guest_") && note.username !== username) return err("forbidden", 403)
  await env.DB.prepare("DELETE FROM reactions WHERE id = ? AND emoji = ? AND username = ?")
    .bind(id, emoji, username).run()
  return json({ success: "ok" })
})

notesApp.patch("/:id/pin", async c => {
  const env = c.env
  const requester = await requireRole(env, c.req.raw)
  if (!requester) return err("unauthorized", 401)
  await env.DB.prepare("UPDATE notes SET pinned = CASE WHEN pinned = 0 THEN 1 ELSE 0 END WHERE id = ? AND username = ?")
    .bind(c.req.param("id"), requester).run()
  return json({ success: "ok" })
})

notesApp.patch("/:id/restore", async c => {
  const env = c.env
  const id = c.req.param("id")
  const username = c.req.query("username") ?? ""
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser || tokenUser !== username) return err("unauthorized", 401)
  const t = await env.DB.prepare(
    "SELECT content, created_at, updated_at, pinned, tags, avatar, nickname FROM trash WHERE id = ? AND username = ?",
  ).bind(id, username).first<{ content: string; created_at: number; updated_at: number; pinned: number; tags: string; avatar: string; nickname: string }>()
  if (!t) return err("not found in trash", 404)
  const res = await env.DB.prepare(
    "INSERT OR IGNORE INTO notes (id, content, created_at, updated_at, pinned, tags, username, avatar, nickname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(id, t.content, t.created_at, t.updated_at, t.pinned, t.tags, username, t.avatar, t.nickname).run()
  if (res.meta.changes === 0) return err("笔记ID冲突，恢复失败", 409)
  await env.DB.prepare("DELETE FROM trash WHERE id = ?").bind(id).run()
  return json({ success: "ok" })
})

notesApp.delete("/:id/hard-delete", async c => {
  const env = c.env
  const id = c.req.param("id")
  const username = c.req.query("username") ?? ""
  const tokenUser = await verifyToken(env, c.req.raw)
  if (!tokenUser || tokenUser !== username) return err("unauthorized", 401)
  const res = await env.DB.prepare("DELETE FROM trash WHERE id = ? AND username = ?").bind(id, username).run()
  if (res.meta.changes === 0) return err("not found", 404)
  return json({ success: "ok" })
})

notesApp.put("/:id", async c => {
  const env = c.env
  const requester = await requireRole(env, c.req.raw)
  if (!requester) return err("unauthorized", 401)
  const id = c.req.param("id")
  const body = await parseJSON<{ content?: string; tags?: string[]; updatedAt?: number }>(c.req.raw, { content: "", tags: [], updatedAt: Date.now() })
  const note = await env.DB.prepare("SELECT username FROM notes WHERE id = ?").bind(id).first<{ username: string }>()
  if (!note) return err("note not found", 404)
  const caller = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(requester).first<{ role: string }>()
  if (requester !== note.username && caller?.role !== "admin") return err("forbidden", 403)
  await env.DB.prepare("UPDATE notes SET content = ?, tags = ?, updated_at = ? WHERE id = ?")
    .bind(body.content ?? "", JSON.stringify(body.tags ?? []), body.updatedAt ?? Date.now(), id).run()
  return json({ success: "ok" })
})

notesApp.delete("/:id", async c => {
  const env = c.env
  const requester = await requireRole(env, c.req.raw)
  if (!requester) return err("unauthorized", 401)
  const id = c.req.param("id")
  const note = await env.DB.prepare("SELECT username FROM notes WHERE id = ?").bind(id).first<{ username: string }>()
  if (!note) return err("note not found", 404)
  const caller = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(requester).first<{ role: string }>()
  if (requester !== note.username && caller?.role !== "admin") return err("forbidden", 403)
  const n = await env.DB.prepare(
    "SELECT content, created_at, updated_at, pinned, tags, avatar, nickname FROM notes WHERE id = ?",
  ).bind(id).first<{ content: string; created_at: number; updated_at: number; pinned: number; tags: string; avatar: string; nickname: string }>()
  if (!n) return err("碎片笔记不存在", 404)
  await env.DB.prepare(
    "INSERT OR IGNORE INTO trash (id, content, created_at, updated_at, pinned, tags, username, avatar, nickname, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(id, n.content, n.created_at, n.updated_at, n.pinned, n.tags, note.username, n.avatar, n.nickname, Date.now()).run()
  await env.DB.prepare("DELETE FROM notes WHERE id = ?").bind(id).run()
  return json({ success: "ok" })
})
