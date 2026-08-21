import { useAuthStore } from "@/stores/auth"

export function getReactionUserId(): string {
  const auth = useAuthStore()
  if (auth.isLoggedIn && auth.userName) return auth.userName
  let gid = localStorage.getItem("suisui-guest")
  if (!gid) {
    gid = "guest_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    localStorage.setItem("suisui-guest", gid)
  }
  return gid
}
