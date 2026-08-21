import { ref } from "vue"

// Singleton cache — shared across all component instances
let cachedCategories: { id: number; icon: string; list: string[] }[] | null = null
let loadingPromise: Promise<void> | null = null

const groupLabels: Record<number, string> = {
  0: "😊", 1: "🤝", 3: "🐻", 4: "🍔", 5: "🏠", 6: "⚽", 7: "💡", 8: "❤️", 9: "🚩",
}

async function loadEmojiDataOnce(): Promise<void> {
  if (cachedCategories) return
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    const raw = (await import("emojibase-data/zh/compact.json")).default as { group?: number; unicode?: string }[]
    const cats = [0, 1, 3, 4, 5, 6, 7, 8, 9].map((g) => ({
      id: g,
      icon: groupLabels[g] || "?",
      list: [] as string[],
    }))
    for (const e of raw) {
      if (e.group === undefined || e.group === 2) continue
      const cat = cats.find((c) => c.id === e.group)
      if (cat && e.unicode) cat.list.push(e.unicode)
    }
    cachedCategories = cats
  })()

  return loadingPromise
}

// Start loading immediately (module level) so data is ready when UI opens
loadEmojiDataOnce()

export function useEmojiPicker() {
  const showEmojiPicker = ref(false)
  const emojiCategories = ref(cachedCategories || [])
  const activeEmojiCat = ref(0)

  async function ensureLoaded() {
    if (emojiCategories.value.length) return
    await loadEmojiDataOnce()
    emojiCategories.value = cachedCategories || []
  }

  return { showEmojiPicker, emojiCategories, activeEmojiCat, ensureLoaded }
}
