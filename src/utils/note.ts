import type { Note } from "@/stores/notes"

export function displayName(memo: Note): string {
  return memo.nickname?.trim() || memo.username || "匿名"
}
