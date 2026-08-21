<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from "vue"
import { useRoute } from "vue-router"
import type { Note } from "@/stores/notes"
import { useNotesStore } from "@/stores/notes"
import { tagColor } from "@/utils/color"
import { timeAgo } from "@/utils/time"
import { displayName } from "@/utils/note"
import { isImage } from "@/utils/url"
import { getReactionUserId } from "@/utils/auth"
import { useEmojiPicker } from "@/utils/useEmojiPicker"
const MarkdownPreview = defineAsyncComponent(() => import("./MarkdownPreview.vue"))
import AppLogo from "./AppLogo.vue"
import { API_BASE_URL } from "@/utils/api"

const note = ref<Note | null>(null)
const loading = ref(true)
const error = ref("")
const store = useNotesStore()
const route = useRoute()

const { showEmojiPicker, emojiCategories, activeEmojiCat } = useEmojiPicker()

async function loadSharedNote() {
  const token = route.params.token as string
  if (!token) {
    error.value = "无效的分享链接"
    loading.value = false
    return
  }
  try {
    const res = await fetch(API_BASE_URL + `/api/share/${token}`)
    if (res.ok) {
      const n = await res.json()
      note.value = n
      // Set page title to first chars of note content
      const preview = (n.content || "").replace(/!\[.*?\]\(.+?\)/g, "[图片]").replace(/[#*`>\-()]/g, "").trim().substring(0, 30)
      document.title = preview ? `📝 ${preview}${n.content?.length > 30 ? "…" : ""} - 碎碎 SuiSui` : "碎碎 SuiSui"
    } else {
      const data = await res.json()
      error.value = data.error || "笔记不存在或分享链接已失效"
    }
  } catch (err) {
    console.error("[ShareView] loadSharedNote failed:", err)
    error.value = "无法加载笔记"
  }
  loading.value = false
}

onMounted(loadSharedNote)

function hasReacted(emoji: string) {
  return note.value?.reactions?.[emoji]?.includes(getReactionUserId())
}

async function toggleReaction(emoji: string) {
  const n = note.value
  if (!n) return
  if (hasReacted(emoji)) {
    await store.removeReaction(n.id, emoji, getReactionUserId())
    const users = n.reactions?.[emoji]
    if (users) {
      const r = n.reactions!
      r[emoji] = users.filter(u => u !== getReactionUserId())
      if (r[emoji].length === 0) delete r[emoji]
    }
  } else {
    await store.reactToNote(n.id, emoji, getReactionUserId())
    if (!n.reactions) n.reactions = {}
    if (!n.reactions[emoji]) n.reactions[emoji] = []
    n.reactions[emoji].push(getReactionUserId())
  }
}
</script>

<template>
  <div class="share-page">
    <div class="share-header">
      <a href="/" class="share-home-link">
        <AppLogo :size="20" />
        <span>碎碎 SuiSui</span>
      </a>
    </div>

    <main class="share-main">
      <div v-if="loading" class="d-flex justify-center py-16">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <div v-else-if="error" class="share-error">
        <v-icon size="48" color="error" class="mb-3">mdi-link-variant-off</v-icon>
        <h2>分享链接无效</h2>
        <p class="text-medium-emphasis">{{ error }}</p>
        <v-btn variant="flat" color="primary" href="/" class="mt-4 rounded-pill">返回首页</v-btn>
      </div>
      <div v-else-if="note" class="share-note-card">
        <div class="share-note-header">
          <div class="d-flex align-center ga-2">
            <div v-if="isImage(note.avatar)" class="share-avatar">
              <img :src="note.avatar" alt="" width="28" height="28" style="border-radius:6px;object-fit:cover" />
            </div>
            <div v-else class="share-avatar-fallback">{{ displayName(note).charAt(0).toUpperCase() }}</div>
            <div>
              <div class="share-author-name">{{ displayName(note) }}</div>
              <div class="share-time">{{ timeAgo(note.createdAt) }}</div>
            </div>
          </div>
        </div>
        <div class="share-content">
          <MarkdownPreview :content="note.content" />
        </div>
        <div v-if="note.tags && note.tags.length" class="d-flex flex-wrap ga-1 mt-1">
          <v-chip v-for="tag in note.tags" :key="tag" size="x-small" variant="tonal" :color="tagColor(tag)">
            #{{ tag }}
          </v-chip>
        </div>
        <div class="reactions-row mt-1">
          <template v-for="(users, emoji) in note.reactions || {}" :key="emoji">
            <v-chip v-if="users && users.length" size="x-small" variant="tonal"
              :class="['reaction-chip', { active: hasReacted(emoji) }]"
              @click="toggleReaction(emoji)">
              {{ emoji }} {{ users.length }}
            </v-chip>
          </template>
          <v-menu v-model="showEmojiPicker" :close-on-content-click="false" location="top" transition="fade-transition">
            <template #activator="{ props: menuProps }">
              <v-btn icon="mdi-plus-circle-outline" size="x-small" variant="text"
                class="reaction-add-btn" aria-label="添加反应" v-bind="menuProps" />
            </template>
            <div class="emoji-picker" style="width:280px">
              <div class="d-flex ga-1 pa-2" style="border-bottom:1px solid rgba(var(--v-theme-on-surface),0.08);overflow-x:auto">
                <v-btn v-for="cat in emojiCategories" :key="cat.id" size="x-small" variant="text"
                  :class="['cat-btn', { active: activeEmojiCat === cat.id }]"
                  @click="activeEmojiCat = cat.id">
{{ cat.icon }}
</v-btn>
              </div>
              <div class="emoji-grid pa-2">
                <v-btn v-for="(e, ei) in emojiCategories.find(c => c.id === activeEmojiCat)?.list || []" :key="e + '-' + ei"
                  size="x-small" variant="text" class="emoji-btn"
                  @click="toggleReaction(e); showEmojiPicker = false">
{{ e }}
</v-btn>
              </div>
            </div>
          </v-menu>
        </div>
      </div>
    </main>

    <footer class="share-footer">
      <span>来自 <a href="/">碎碎 SuiSui</a> 的分享</span>
    </footer>
  </div>
</template>

<style scoped>
.share-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(var(--v-theme-primary), 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(var(--v-theme-primary), 0.04) 0%, transparent 50%),
    rgb(var(--v-theme-background));
}
.share-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  background: rgba(var(--v-theme-surface), 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: sticky; top: 0; z-index: 10;
}
.share-home-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.share-home-link:hover { opacity: 1; }
.share-main {
  display: flex;
  justify-content: center;
  padding: 20px 16px;
}
.share-error {
  text-align: center;
  padding: 48px 16px;
}
.share-error h2 { font-size: 1.2rem; margin-bottom: 8px; }
.share-note-card {
  width: 100%;
  max-width: 620px;
  background: rgba(var(--v-theme-surface), 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  padding: 14px 20px 10px;
}
.share-note-header {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.share-avatar-fallback {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
}
.share-author-name { font-weight: 600; font-size: 0.95rem; }
.share-time { font-size: 0.78rem; color: rgba(var(--v-theme-on-surface), 0.45); }
.share-content {
  line-height: 1.65;
  font-size: 1rem;
}
.share-footer {
  text-align: center;
  padding: 20px;
  font-size: 0.82rem;
  color: rgba(var(--v-theme-on-surface), 0.35);
}
.share-footer a { color: inherit; }
.reactions-row { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.reaction-chip { font-size: 0.75rem; height: 26px !important; cursor: pointer; }
.reaction-chip.active { outline: 1px solid rgb(var(--v-theme-primary)); }
.reaction-add-btn { opacity: 0.4; }
.reaction-add-btn:hover { opacity: 1; }
.emoji-picker { background: rgba(var(--v-theme-surface), 0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(var(--v-theme-on-surface),0.08); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.emoji-btn { font-size: 1.1rem; width: 32px; height: 32px; min-width: 0 !important; padding: 0 !important; }
.cat-btn { font-size: 1rem; width: 28px; height: 28px; min-width: 0 !important; border-radius: 8px; opacity:0.5; transition:all 0.15s; }
.cat-btn:hover { opacity:1; }
.cat-btn.active { opacity:1; background: rgba(var(--v-theme-primary),0.1); }
.emoji-grid { display: grid; grid-template-columns: repeat(7, 32px); gap: 4px; max-height: 280px; overflow-y: auto; }

@media (max-width: 640px) {
  .share-header { padding: 12px 16px; }
  .share-main { padding: 20px 12px; }
  .share-note-card { padding: 14px 16px 12px; border-radius: 12px; }
  .share-content { font-size: 0.95rem; line-height: 1.55; }
  .share-author-name { font-size: 0.9rem; }
  .share-footer { padding: 14px; }
}
</style>
