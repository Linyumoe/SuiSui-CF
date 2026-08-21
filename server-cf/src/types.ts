/** Cloudflare Worker 环境绑定 */
export interface Env {
  DB: D1Database
  /** 图片存储：Workers KV（免费，无需绑卡） */
  UPLOADS: KVNamespace
  /** 可选：GitHub API 代理 token（wrangler secret put GITHUB_TOKEN） */
  GITHUB_TOKEN?: string
  /** 构建时注入的版本号 */
  VERSION?: string
}

export interface NoteRow {
  id: string
  content: string
  created_at: number
  updated_at: number
  pinned: number
  tags: string
  username: string
  avatar: string
  nickname: string
  pin_order: number
}

export interface TrashRow {
  id: string
  content: string
  created_at: number
  updated_at: number
  pinned: number
  tags: string
  username: string
  avatar: string
  nickname: string
  deleted_at: number
  pin_order: number
}

export interface NoteJSON {
  id: string
  content: string
  createdAt: number
  updatedAt: number
  pinned: boolean
  tags: string[]
  username: string
  avatar?: string
  nickname?: string
  reactions?: Record<string, string[]>
}

/** 允许上传的图片扩展名 */
export const allowedUploadExts = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp",
])

export const MAX_UPLOAD_BYTES = 10 << 20 // 10 MB
export const MAX_NOTE_CONTENT = 50000
