import { Hono } from "hono"
import { Env, allowedUploadExts } from "./types"
import { json, err, corsHeaders, securityHeaders } from "./util"
import { authApp, ensureAdmin } from "./auth"
import { notesApp } from "./notes"
import { adminApp, settingsApp, shareApp } from "./admin"
import { ghApp } from "./gh"

const app = new Hono<{ Bindings: Env }>()

// 惰性初始化默认管理员（首次请求时若用户表为空则创建 admin/admin）
app.use("/api/*", async (c, next) => {
  await ensureAdmin(c.env).catch(e => console.error("[ensureAdmin]", e))
  await next()
})

// 统一 CORS + 安全头
app.use("/api/*", async (c, next) => {
  await next()
  const res = c.res
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries({ ...corsHeaders(), ...securityHeaders() })) headers.set(k, v)
  c.res = new Response(res.body, { status: res.status, statusText: res.statusText, headers })
})

// OPTIONS 预检
app.options("/api/*", c => {
  return new Response(null, { status: 204, headers: { ...corsHeaders(), ...securityHeaders() } })
})

// 子路由
app.route("/api/auth", authApp)
app.route("/api/notes", notesApp)
app.route("/api/admin", adminApp)
app.route("/api/settings", settingsApp)
app.route("/api/share", shareApp)
app.route("/api/gh", ghApp)

// 健康检查
app.get("/health", c => {
  return json({ status: "ok", dbSchemaVersion: 1, version: c.env.VERSION ?? "cf" })
})

// 图片读取（R2）
app.get("/uploads/:key", async c => {
  const key = c.req.param("key")
  if (!key || key.includes("..") || key.includes("/") || key.includes("\\")) {
    return err("invalid path", 400)
  }
  const dot = key.lastIndexOf(".")
  const ext = dot >= 0 ? key.slice(dot).toLowerCase() : ""
  if (!allowedUploadExts.has(ext)) return c.notFound()
  const obj = await c.env.UPLOADS.get(key)
  if (!obj) return c.notFound()
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set("Cache-Control", "public, max-age=604800")
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("Access-Control-Allow-Origin", "*")
  return new Response(obj.body, { headers })
})

// 404 / 错误处理
app.notFound(() => err("not found", 404))
app.onError((e, c) => {
  console.error("[suisui] error:", e)
  return err("internal server error", 500)
})

export default app
