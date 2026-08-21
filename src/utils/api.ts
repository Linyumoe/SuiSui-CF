import { useAuthStore } from "@/stores/auth"

const TOKEN_KEY = "suisui-token"

/** Base URL for API requests. Override via VITE_API_BASE at build time. */
export const API_BASE_URL: string = (import.meta.env as { VITE_API_BASE?: string }).VITE_API_BASE ?? ""

function getToken(): string {
  try {
    const auth = useAuthStore()
    return auth.getAuthToken()
  } catch (err) {
    console.error("[api] getToken failed, falling back to localStorage:", err)
    return localStorage.getItem(TOKEN_KEY) || ""
  }
}

/**
 * Fetch a URL relative to the API base.
 * Automatically prepends API_BASE_URL and attaches Authorization: Bearer header.
 */
export function apiUrl(path: string): string {
  return API_BASE_URL + path
}

/** Fetch wrapper that automatically attaches Authorization: Bearer header. */
export function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = getToken()
  if (token) {
    options = { ...options }
    options.headers = { ...(options.headers as Record<string, string> | undefined), "Authorization": "Bearer " + token }
  }
  return fetch(API_BASE_URL + url, options)
}

/** Shortcut: fetch with JSON body and Authorization header. */
export function authFetchJSON(url: string, data: unknown, method = "POST"): Promise<Response> {
  return authFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}
