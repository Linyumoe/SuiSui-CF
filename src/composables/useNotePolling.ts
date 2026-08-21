import { ref, onBeforeUnmount } from "vue"
import { useNotesStore } from "@/stores/notes"
import { API_BASE_URL, authFetch } from "@/utils/api"

export function useNotePolling() {
  const store = useNotesStore()
  const newNotesCount = ref(0)
  let lastActionAt = 0
  let pollingTimer: ReturnType<typeof setInterval> | null = null
  let evtSource: EventSource | null = null

  function onNoteSubmitted() {
    lastActionAt = Date.now()
  }

  function startPolling() {
    if (evtSource || pollingTimer) return // already polling
    evtSource = new EventSource(API_BASE_URL + "/api/events")
    evtSource.addEventListener("note", () => {
      if (Date.now() - lastActionAt < 3000) return
      authFetch("/api/notes?limit=1&offset=0")
        .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() })
        .then(data => {
          if (data.total > store.total && store.total > 0) {
            newNotesCount.value = data.total - store.total
          }
        })
        .catch((err) => { console.error("[useNotePolling]", err) })
    })
    evtSource.onerror = () => { evtSource?.close(); evtSource = null }
    pollingTimer = setInterval(async () => {
      if (Date.now() - lastActionAt < 3000) return
      try {
        const res = await authFetch("/api/notes?limit=1&offset=0")
        if (res.ok) {
          const data = await res.json()
          if (data.total > store.total && store.total > 0) {
            newNotesCount.value = data.total - store.total
          }
        }
      } catch { /* ignore polling errors */ }
    }, 15000)
  }

  function stopPolling() {
    if (evtSource) { evtSource.close(); evtSource = null }
    if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null }
  }

  function refreshNotes() {
    store.fetchNotes(true)
    newNotesCount.value = 0
    authFetch("/api/notes?limit=1&offset=0")
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() })
      .then(data => {
        if (data.total) store.total = data.total
      })
      .catch((err) => { console.error("[useNotePolling]", err) })
  }

  onBeforeUnmount(() => {
    stopPolling()
  })

  return {
    newNotesCount,
    onNoteSubmitted,
    startPolling,
    stopPolling,
    refreshNotes,
  }
}
