import { describe, it, expect } from "vitest"
import { generateToken, timingSafeEqual, randomHex, hex } from "../src/util"
import { hashPassword, checkPassword, generateSalt } from "../src/crypto"

describe("crypto", () => {
  it("hashes and verifies a password", async () => {
    const salt = generateSalt()
    const hash = await hashPassword("secret123", salt)
    expect(hash.startsWith("pbkdf2$")).toBe(true)
    expect(await checkPassword("secret123", hash, salt)).toBe(true)
    expect(await checkPassword("wrong", hash, salt)).toBe(false)
  })

  it("rejects malformed stored hashes", async () => {
    expect(await checkPassword("x", "not-a-hash", "salt")).toBe(false)
    expect(await checkPassword("x", "pbkdf2$abc$s$h", "salt")).toBe(false)
    expect(await checkPassword("x", "pbkdf2$1$s$h", "salt")).toBe(false) // iterations < 1000
  })

  it("is deterministic for same salt", async () => {
    expect(await hashPassword("pwd", "salt1")).toBe(await hashPassword("pwd", "salt1"))
    expect(await hashPassword("pwd", "salt1")).not.toBe(await hashPassword("pwd", "salt2"))
  })
})

describe("tokens", () => {
  it("generates 64 hex chars", () => {
    expect(generateToken()).toMatch(/^[0-9a-f]{64}$/)
    expect(generateSalt()).toMatch(/^[0-9a-f]{32}$/)
  })
  it("generates unique tokens", () => {
    const a = generateToken()
    const b = generateToken()
    expect(a).not.toBe(b)
  })
})

describe("timingSafeEqual", () => {
  it("compares strings safely", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true)
    expect(timingSafeEqual("abc", "abd")).toBe(false)
    expect(timingSafeEqual("abc", "abcd")).toBe(false)
  })
})

describe("hex", () => {
  it("encodes bytes to hex", () => {
    expect(hex(new Uint8Array([0, 255, 16]).buffer)).toBe("00ff10")
    expect(randomHex(4)).toMatch(/^[0-9a-f]{8}$/)
  })
})
