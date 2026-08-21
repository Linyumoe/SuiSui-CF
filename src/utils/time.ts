export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "刚刚"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, "0")
  const dateStr = `${d.getMonth() + 1}月${pad(d.getDate())}日`
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const year = d.getFullYear()
  const nowYear = new Date().getFullYear()
  if (year !== nowYear) return `${year}年${dateStr} ${timeStr}`
  return `${dateStr} ${timeStr}`
}
