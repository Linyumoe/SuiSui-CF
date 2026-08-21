<script setup lang="ts">
import { ref } from "vue"
import { useAuthStore } from "@/stores/auth"
import { authFetch } from "@/utils/api"
import AvatarPicker from "@/components/AvatarPicker.vue"

const auth = useAuthStore()

const snackbar = ref(false)
const snackMsg = ref("")
const nickInput = ref(auth.userNickname)
const nickError = ref("")
const showNickDialog = ref(false)
const showPwdDialog = ref(false)
const pwdOld = ref("")
const pwdNew = ref("")
const pwdConfirm = ref("")
const showAvatarPicker = ref(false)
const importing = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function openNickDialog() { nickInput.value = auth.userNickname; nickError.value = ""; showNickDialog.value = true }
function openPwdDialog() { pwdOld.value = ""; pwdNew.value = ""; pwdConfirm.value = ""; showPwdDialog.value = true }

async function saveNickname() {
  nickError.value = ""
  if (!nickInput.value.trim()) return
  const err = await auth.updateNickname(nickInput.value)
  if (err) { nickError.value = err; return }
  showNickDialog.value = false
  snackMsg.value = "昵称已保存"; snackbar.value = true
}
async function savePassword() {
  if (!pwdOld.value || !pwdNew.value || pwdNew.value.length < 4 || pwdNew.value !== pwdConfirm.value) return
  try {
    const res = await authFetch("/api/auth/password", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: auth.userName, oldPassword: pwdOld.value, newPassword: pwdNew.value })
    })
    const result = await res.json()
    if (result.error) { snackMsg.value = result.error; snackbar.value = true; return }
    pwdOld.value = ""; pwdNew.value = ""; pwdConfirm.value = ""; showPwdDialog.value = false
    snackMsg.value = "密码已修改"; snackbar.value = true
  } catch { console.warn("changePassword failed") }
}
async function exportNotes() {
  try {
    const res = await authFetch(`/api/notes/export?username=${auth.userName}`)
    if (!res.ok) { snackMsg.value = "导出失败"; snackbar.value = true; return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `suisui-notes-${auth.userName}-${Date.now()}.json`
    a.click(); URL.revokeObjectURL(url)
    snackMsg.value = "导出成功"; snackbar.value = true
  } catch { snackMsg.value = "导出失败"; snackbar.value = true }
}

async function importNotes(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importing.value = true
  try {
    const text = await file.text()
    const notes = JSON.parse(text)
    const res = await authFetch("/api/notes/import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notes),
    })
    if (res.ok) {
      const data = await res.json()
      snackMsg.value = `成功导入 ${data.imported} 条碎片笔记`; snackbar.value = true
    } else { snackMsg.value = "导入失败"; snackbar.value = true }
  } catch { snackMsg.value = "文件格式错误"; snackbar.value = true }
  importing.value = false
  input.value = ""
}
</script>

<template>
  <div class="profile-page">
    <v-snackbar v-model="snackbar" :timeout="2000" location="top right" color="success" variant="tonal">
      {{ snackMsg }}
    </v-snackbar>

    <!-- Profile Card -->
    <div class="settings-card">
      <div class="settings-card-header">
        <v-icon size="small" color="primary">mdi-account-circle</v-icon>
        <span>个人资料</span>
      </div>
      <div class="settings-body">
        <div class="setting-row">
          <div class="setting-label">
            <v-icon size="small" color="primary" class="setting-icon">mdi-image</v-icon>
            <div class="setting-text">
              <span class="setting-name">头像</span>
              <span class="setting-desc">自定义你的头像</span>
            </div>
          </div>
          <v-btn size="small" variant="tonal" class="setting-btn" @click="showAvatarPicker = true">修改</v-btn>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <v-icon size="small" color="primary" class="setting-icon">mdi-card-account-details</v-icon>
            <div class="setting-text">
              <span class="setting-name">昵称</span>
              <span class="setting-desc">{{ auth.userNickname || "未设置" }}</span>
            </div>
          </div>
          <v-btn size="small" variant="tonal" class="setting-btn" @click="openNickDialog">修改</v-btn>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <v-icon size="small" color="primary" class="setting-icon">mdi-lock</v-icon>
            <div class="setting-text">
              <span class="setting-name">密码</span>
              <span class="setting-desc">修改你的登录密码</span>
            </div>
          </div>
          <v-btn size="small" variant="tonal" class="setting-btn" @click="openPwdDialog">修改</v-btn>
        </div>
      </div>
    </div>

    <!-- Data Card -->
    <div class="settings-card">
      <div class="settings-card-header">
        <v-icon size="small" color="primary">mdi-database</v-icon>
        <span>数据管理</span>
      </div>
      <div class="settings-body">
        <div class="setting-row">
          <div class="setting-label">
            <v-icon size="small" color="primary" class="setting-icon">mdi-export</v-icon>
            <div class="setting-text">
              <span class="setting-name">导出碎片笔记</span>
              <span class="setting-desc">下载为 JSON 文件备份</span>
            </div>
          </div>
          <v-btn size="small" variant="tonal" class="setting-btn" @click="exportNotes">导出</v-btn>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <v-icon size="small" color="primary" class="setting-icon">mdi-import</v-icon>
            <div class="setting-text">
              <span class="setting-name">导入碎片笔记</span>
              <span class="setting-desc">从 JSON 文件恢复</span>
            </div>
          </div>
          <v-btn size="small" variant="tonal" class="setting-btn" :loading="importing" @click="fileInput?.click()">导入</v-btn>
        </div>
      </div>
      <input ref="fileInput" type="file" accept=".json" hidden @change="importNotes" />
    </div>

    <AvatarPicker v-model="showAvatarPicker" />

    <!-- Nickname Dialog -->
    <v-dialog v-model="showNickDialog" max-width="400">
      <v-card class="rounded-xl pa-4 glass-dialog">
        <div class="d-flex align-center mb-3">
          <span class="text-subtitle-2 font-weight-medium">修改昵称</span>
          <v-spacer />
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="showNickDialog = false" />
        </div>
        <v-text-field v-model="nickInput" variant="outlined" hide-details density="compact" placeholder="设置昵称" autofocus @keyup.enter="saveNickname" />
        <div v-if="nickError" class="text-caption text-error mt-1">{{ nickError }}</div>
        <div class="d-flex justify-end ga-2 mt-3">
          <v-btn variant="text" size="small" @click="showNickDialog = false">取消</v-btn>
          <v-btn variant="tonal" color="primary" size="small" class="rounded-pill" @click="saveNickname">保存</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Password Dialog -->
    <v-dialog v-model="showPwdDialog" max-width="400">
      <v-card class="rounded-xl pa-4 glass-dialog">
        <div class="d-flex align-center mb-3">
          <span class="text-subtitle-2 font-weight-medium">修改密码</span>
          <v-spacer />
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="showPwdDialog = false" />
        </div>
        <div class="d-flex flex-column ga-3">
          <v-text-field v-model="pwdOld" type="password" variant="outlined" hide-details density="compact" placeholder="旧密码" autocomplete="current-password" spellcheck="false" autofocus />
          <v-text-field v-model="pwdNew" type="password" variant="outlined" hide-details density="compact" placeholder="新密码（至少4位）" autocomplete="new-password" spellcheck="false" />
          <v-text-field v-model="pwdConfirm" type="password" variant="outlined" hide-details density="compact" placeholder="确认新密码" autocomplete="new-password" spellcheck="false" />
        </div>
        <div class="d-flex justify-end ga-2 mt-3">
          <v-btn variant="text" size="small" @click="showPwdDialog = false">取消</v-btn>
          <v-btn variant="tonal" color="primary" size="small" class="rounded-pill" @click="savePassword">保存</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Card base */
.settings-card {
  background: rgba(var(--v-theme-surface), 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  overflow: hidden;
}
.settings-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}
.settings-body { padding: 4px 0; }

/* Setting rows */
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  gap: 12px;
  transition: background 0.15s;
}
.setting-row:hover { background: rgba(var(--v-theme-primary), 0.02); }
.setting-row + .setting-row { border-top: 1px solid rgba(var(--v-theme-on-surface), 0.04); }
.setting-label {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.setting-icon { flex-shrink: 0; }
.setting-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.setting-name {
  font-size: 0.88rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}
.setting-desc {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.setting-btn { border-radius: 8px; flex-shrink: 0; }

/* Dialog */
.glass-dialog {
  background: rgba(var(--v-theme-surface), 0.92) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

@media (max-width: 768px) {
  .setting-row { padding: 10px 14px; }
  .settings-card-header { padding: 12px 14px; }
}
</style>
