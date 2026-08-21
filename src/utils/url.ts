export function isImage(url: string | undefined | null): boolean {
  if (!url) return false
  if (url.startsWith("/uploads/")) return true
  // Check common image extensions
  const ext = url.split("?")[0].toLowerCase()
  return /\.(png|jpg|jpeg|gif|webp|bmp|ico|svg)$/i.test(ext)
}
