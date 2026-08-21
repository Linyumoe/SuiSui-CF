<script setup lang="ts">
import { ref, computed } from "vue"
import { authFetch } from "@/utils/api"
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>()
const uploading = ref(false)
const previewUrl = ref("")
const uploadError = ref("")

const hasFavicon = computed(() => !!previewUrl.value)

function triggerUpload() {
  const input = document.getElementById("favicon-input") as HTMLInputElement
  input?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { uploadError.value = "Favicon 大小不能超过 2MB"; return }
  uploadError.value = ""
  previewUrl.value = URL.createObjectURL(file)
  uploading.value = true
  const fd = new FormData()
  fd.append("image", file)
  try {
    const res = await authFetch("/api/notes/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (data.success) {
      await authFetch("/api/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "site_favicon", value: data.url })
      })
      const link = document.querySelector("link[rel=icon]") || document.createElement("link")
      link.setAttribute("rel", "icon")
      link.setAttribute("href", data.url)
      document.head.appendChild(link)
      // also update shortcut icon and apple-touch-icon for mobile browsers
      for (const rel of ["shortcut icon", "apple-touch-icon"]) {
        let el = document.querySelector(`link[rel="${rel}"]`)
        if (!el) { el = document.createElement("link"); document.head.appendChild(el) }
        el.setAttribute("rel", rel)
        el.setAttribute("href", data.url)
      }
      uploadError.value = ""
    } else { uploadError.value = data.error || "上传失败" }
  } catch { uploadError.value = "网络错误，请重试" }
  uploading.value = false
}

function handleClose() {
  previewUrl.value = ""
  uploadError.value = ""
  emit("update:modelValue", false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="420" persistent @update:model-value="handleClose">
    <v-card class="rounded-xl" flat>
      <div class="d-flex align-center pa-4 pb-2">
        <span class="text-subtitle-1 font-weight-medium">Favicon</span>
        <v-spacer />
        <v-btn icon="mdi-close" size="x-small" variant="text" @click="handleClose" />
      </div>
      <v-divider class="mx-4" />
      <v-card-text class="pa-6 d-flex flex-column align-center ga-4">
        <div class="favicon-preview-wrap">
          <img v-if="hasFavicon" :src="previewUrl" class="favicon-preview" />
          <div v-else class="favicon-placeholder">
            <v-icon size="40" color="rgba(255,255,255,0.6)">mdi-star</v-icon>
          </div>
          <div v-if="uploading" class="favicon-overlay">
            <v-progress-circular indeterminate size="24" color="white" />
          </div>
        </div>
        <v-btn variant="outlined" color="primary" size="large" class="rounded-pill px-6" :loading="uploading" prepend-icon="mdi-upload" @click="triggerUpload">选择图片</v-btn>
        <input id="favicon-input" type="file" accept="image/*" hidden @change="onFileChange" />
        <span class="text-caption text-medium-emphasis">浏览器标签栏图标，建议 32×32，PNG 格式</span>
        <v-alert v-if="uploadError" density="compact" variant="tonal" type="error" class="w-100 rounded-lg">{{ uploadError }}</v-alert>
      </v-card-text>
      <v-divider class="mx-4" />
      <div class="d-flex align-center justify-end pa-4 pt-3">
        <v-btn variant="tonal" color="primary" class="rounded-pill px-5" @click="handleClose">完成</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.favicon-preview-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 16px;
  overflow: hidden;
  border: 3px solid rgba(var(--v-theme-primary), 0.15);
  transition: border-color 0.2s;
  flex-shrink: 0;
}
.favicon-preview-wrap:hover { border-color: rgba(var(--v-theme-primary), 0.4); }
.favicon-preview { width: 100%; height: 100%; object-fit: contain; padding: 8px; }
.favicon-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgba(var(--v-theme-primary), 0.4));
  border-radius: 16px;
}
.favicon-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  border-radius: 16px;
}
.w-100 { width: 100%; }
</style>
