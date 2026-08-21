<script setup lang="ts">
import { ref, watch } from "vue"
import type { Note } from "@/stores/notes"
import { useNotesStore } from "@/stores/notes"
import { useAuthStore } from "@/stores/auth"
import { authFetch } from "@/utils/api"

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ "update:modelValue": [v: boolean] }>()

const auth = useAuthStore()
const store = useNotesStore()
const deletedNotes = ref<Note[]>([])

watch(() => props.modelValue, (v) => { if (v) fetchDeletedNotes() })

async function fetchDeletedNotes() {
  try {
    const res = await authFetch(`/api/notes/trash?username=${auth.userName}`)
    if (res.ok) { deletedNotes.value = await res.json() }
  } catch (err) { console.error("[TrashDialog] fetchDeletedNotes failed:", err) }
}

async function restoreNote(id: string) {
  try {
    const res = await authFetch(`/api/notes/${id}/restore?username=${auth.userName}`, { method: "PATCH" })
    if (res.ok) { deletedNotes.value = deletedNotes.value.filter(n => n.id !== id); await store.fetchNotes(true) }
  } catch (err) { console.error("[TrashDialog] restoreNote failed:", err) }
}

async function deleteForever(id: string) {
  try {
    const res = await authFetch(`/api/notes/${id}/hard-delete?username=${auth.userName}`, { method: "DELETE" })
    if (res.ok) { deletedNotes.value = deletedNotes.value.filter(n => n.id !== id) }
  } catch (err) { console.error("[TrashDialog] deleteForever failed:", err) }
}
</script>

<template>
  <v-dialog :model-value="props.modelValue" max-width="500" scrollable @update:model-value="v => emit('update:modelValue', v)">
    <v-card class="rounded-xl pa-4">
      <div class="d-flex align-center mb-3">
        <span class="text-subtitle-2 font-weight-medium">回收站</span>
        <v-spacer />
        <v-btn icon="mdi-close" size="x-small" variant="text" @click="emit('update:modelValue', false)" />
      </div>
      <div v-if="!deletedNotes.length" class="d-flex flex-column align-center py-4 text-medium-emphasis">
        <v-icon size="32" class="mb-2" color="rgba(var(--v-theme-on-surface),0.15)">mdi-delete-outline</v-icon>
        <span class="text-caption">回收站为空</span>
      </div>
      <div v-else class="d-flex flex-column ga-2">
        <div v-for="note in deletedNotes" :key="note.id" class="d-flex align-center ga-2 pa-2"
          style="border-bottom:1px solid rgba(var(--v-theme-on-surface),0.06)">
          <div class="flex-grow-1 text-caption" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            {{ note.content?.replace(/!\[.*?\]\(.+?\)/g, "[图片]").substring(0, 60) }}
          </div>
          <v-btn icon="mdi-restore" size="x-small" variant="text" color="primary" title="恢复" @click="restoreNote(note.id)" />
          <v-btn icon="mdi-delete-forever" size="x-small" variant="text" color="error" title="永久删除" @click="deleteForever(note.id)" />
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>
