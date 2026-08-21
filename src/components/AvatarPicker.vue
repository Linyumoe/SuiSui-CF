<script setup lang="ts">
import { ref, computed } from "vue"
import { useAuthStore } from "@/stores/auth"
import { authFetch } from "@/utils/api"
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>()
const auth = useAuthStore()
const uploading = ref(false)
const previewUrl = ref("")
const uploadError = ref("")

const hasAvatar = computed(() => !!(auth.userAvatar || previewUrl.value))

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Validate file size
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = "图片大小不能超过 10MB"
    return
  }

  uploadError.value = ""
  previewUrl.value = URL.createObjectURL(file)
  uploading.value = true

  const fd = new FormData()
  fd.append("avatar", file)
  try {
    const res = await authFetch("/api/auth/avatar/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (data.success) {
      await auth.updateAvatar(data.url)
      uploadError.value = ""
    } else {
      uploadError.value = data.error || "上传失败"
    }
  } catch {
    uploadError.value = "网络错误，请重试"
  }
  uploading.value = false
}

async function clearAvatar() {
  previewUrl.value = ""
  await auth.updateAvatar("")
}

function handleClose() {
  previewUrl.value = ""
  uploadError.value = ""
  emit("update:modelValue", false)
}

function triggerUpload() {
  const input = document.getElementById("avatar-input") as HTMLInputElement
  input?.click()
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="420" persistent @update:model-value="handleClose">
    <v-card class="rounded-xl" flat>
      <!-- Header -->
      <div class="d-flex align-center pa-4 pb-2">
        <span class="text-subtitle-1 font-weight-medium">修改头像</span>
        <v-spacer />
        <v-btn icon="mdi-close" size="x-small" variant="text" @click="handleClose" />
      </div>

      <v-divider class="mx-4" />

      <v-card-text class="pa-6 d-flex flex-column align-center ga-4">
        <!-- Avatar preview circle -->
        <div class="avatar-preview-wrap">
          <v-img
            v-if="hasAvatar"
            :src="previewUrl || auth.userAvatar"
            width="120"
            height="120"
            class="avatar-preview"
            cover
          />
          <div v-else class="avatar-placeholder">
            <v-icon size="48" color="rgba(255,255,255,0.6)">mdi-camera-plus-outline</v-icon>
          </div>
          <div v-if="uploading" class="avatar-overlay">
            <v-progress-circular indeterminate size="32" color="white" />
          </div>
        </div>

        <!-- Upload button -->
        <v-btn
          variant="outlined"
          color="primary"
          size="large"
          class="rounded-pill px-6"
          :loading="uploading"
          prepend-icon="mdi-upload"
          @click="triggerUpload"
        >
          选择图片
        </v-btn>
        <input
          id="avatar-input"
          type="file"
          accept="image/*"
          hidden
          @change="onFileChange"
        />

        <!-- Hint -->
        <span class="text-caption text-medium-emphasis">支持 JPG / PNG / GIF / WebP，最大 10MB</span>

        <!-- Error message -->
        <v-alert v-if="uploadError" density="compact" variant="tonal" type="error" class="w-100 rounded-lg">
          {{ uploadError }}
        </v-alert>
      </v-card-text>

      <v-divider class="mx-4" />

      <!-- Footer actions -->
      <div class="d-flex align-center justify-space-between pa-4 pt-3">
        <v-btn
          v-if="auth.userAvatar"
          variant="text"
          color="error"
          size="small"
          prepend-icon="mdi-delete-outline"
          :disabled="uploading"
          @click="clearAvatar"
        >
          移除头像
        </v-btn>
        <v-spacer v-else />
        <v-btn variant="tonal" color="primary" class="rounded-pill px-5" @click="handleClose">
          完成
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.avatar-preview-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(var(--v-theme-primary), 0.15);
  transition: border-color 0.2s;
  flex-shrink: 0;
}
.avatar-preview-wrap:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
}
.avatar-preview {
  border-radius: 50%;
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgba(var(--v-theme-primary), 0.4));
  border-radius: 50%;
}
.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.w-100 {
  width: 100%;
}
</style>
