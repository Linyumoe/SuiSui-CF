const TAG_COLORS = ["primary", "teal", "orange", "pink", "indigo", "cyan", "deep-purple", "amber"]

export function tagColor(tag: string): string {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) | 0
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length]
}
