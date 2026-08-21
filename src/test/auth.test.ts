import { describe, it, expect, beforeEach, vi } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useAuthStore } from "@/stores/auth"

describe("auth store", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it("starts logged out by default", () => {
    const store = useAuthStore()
    expect(store.isLoggedIn).toBe(false)
    expect(store.userName).toBe("")
    expect(store.isAdmin).toBe(false)
    expect(store.ready).toBe(false)
  })

  it("logout clears all state", () => {
    const store = useAuthStore()
    store.isLoggedIn = true
    store.userName = "testuser"
    store.userRole = "admin"
    store.logout()
    expect(store.isLoggedIn).toBe(false)
    expect(store.userName).toBe("")
    expect(store.userRole).toBe("user")
  })

  it("login calls API and sets state on success", async () => {
    const fakeRes = {
      ok: true,
      json: () => Promise.resolve({ avatar: "", nickname: "", role: "user", token: "abc123", theme_color: "#1976D2" }),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(fakeRes)

    const store = useAuthStore()
    const err = await store.login("alice", "secret")
    expect(err).toBeNull()
    expect(store.isLoggedIn).toBe(true)
    expect(store.userName).toBe("alice")
    expect(store.userToken).toBe("abc123")
    expect(localStorage.getItem("suisui-auth")).toBe("true")
    expect(localStorage.getItem("suisui-user")).toBe("alice")
  })

  it("login returns error on bad credentials", async () => {
    const fakeRes = {
      ok: false,
      json: () => Promise.resolve({ error: "用户名或密码错误" }),
    }
    globalThis.fetch = vi.fn().mockResolvedValue(fakeRes)

    const store = useAuthStore()
    const err = await store.login("alice", "wrong")
    expect(err).toBe("用户名或密码错误")
    expect(store.isLoggedIn).toBe(false)
  })

  it("isAdmin is true when role is admin", () => {
    const store = useAuthStore()
    store.userRole = "admin"
    expect(store.isAdmin).toBe(true)
  })

  it("isAdmin is false for non-admin roles", () => {
    const store = useAuthStore()
    store.userRole = "user"
    expect(store.isAdmin).toBe(false)
  })

  it("getAuthToken returns token from store or localStorage", () => {
    const store = useAuthStore()
    store.userToken = "store-token"
    expect(store.getAuthToken()).toBe("store-token")

    store.userToken = ""
    localStorage.setItem("suisui-token", "ls-token")
    expect(store.getAuthToken()).toBe("ls-token")
  })
})
