import { hex, timingSafeEqual, randomHex } from "./util"

/** PBKDF2-SHA256 密码哈希（基于 Web Crypto，无需 WASM 依赖） */
const PBKDF2_ITERATIONS = 100_000
const KEY_LEN_BITS = 256

async function derive(pwd: string, salt: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(pwd), "PBKDF2", false, ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations, hash: "SHA-256" },
    key, KEY_LEN_BITS,
  )
  return hex(bits)
}

/** 供测试用的内部函数（实际使用走 hashPassword） */
export const deriveForTest = derive

export async function hashPassword(pwd: string, salt: string): Promise<string> {
  const h = await derive(pwd, salt, PBKDF2_ITERATIONS)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${h}`
}

export async function checkPassword(input: string, stored: string, salt: string): Promise<boolean> {
  const parts = stored.split("$")
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false
  const iterations = Number(parts[1])
  if (!Number.isInteger(iterations) || iterations < 1000) return false
  const h = await derive(input, parts[2], iterations)
  return timingSafeEqual(h, parts[3])
}

export function generateSalt(): string {
  return randomHex(16)
}
