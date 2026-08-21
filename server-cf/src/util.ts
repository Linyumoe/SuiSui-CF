/** 公共工具：响应、安全头、token、hex */

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export function err(msg: string, status = 400): Response {
  return json({ error: msg }, status)
}

/** 安全解析 JSON 请求体；失败时返回默认值 */
export async function parseJSON<T>(request: Request, fallback: T): Promise<T> {
  try {
    const text = await request.text()
    return text ? (JSON.parse(text) as T) : fallback
  } catch {
    return fallback
  }
}

/** 与旧 Go 后端一致的 CORS 头 */
export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}

/** 安全响应头（与旧 Go 版 securityHeaders 对齐） */
export function securityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy":
      "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob:; " +
      "font-src 'self' data:; " +
      "media-src 'self' blob:; " +
      "connect-src 'self' http: https: blob:; " +
      "worker-src 'self' blob:; " +
      "frame-ancestors 'none'; " +
      "form-action 'self'",
  }
}

export function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("")
}

/** 常量时间比较（防时序攻击） */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a)
  const bb = new TextEncoder().encode(b)
  if (ab.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i]
  return diff === 0
}

export function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return [...buf].map(b => b.toString(16).padStart(2, "0")).join("")
}

/** 生成 64 位十六进制 token（用于登录/注册会话） */
export function generateToken(): string {
  return randomHex(32)
}
