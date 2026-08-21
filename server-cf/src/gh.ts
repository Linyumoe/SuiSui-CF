import { Hono } from "hono"
import { Env } from "./types"
import { err } from "./util"

/** GitHub API 代理：GET /api/gh/<path> → https://api.github.com/<path> */
export const ghApp = new Hono<{ Bindings: Env }>()

ghApp.get("/*", async c => {
  const env = c.env
  const path = c.req.path.replace(/^\/api\/gh\//, "")
  if (!path) return err("missing path", 400)
  const upstream = new Request(`https://api.github.com/${path}`, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "suisui",
      ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
    },
  })
  const resp = await fetch(upstream)
  const headers = new Headers()
  for (const k of ["Content-Type", "Content-Length"]) {
    const v = resp.headers.get(k)
    if (v) headers.set(k, v)
  }
  return new Response(resp.body, { status: resp.status, headers })
})
