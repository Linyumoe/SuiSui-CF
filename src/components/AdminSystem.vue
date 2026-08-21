<script setup lang="ts">
import { ref } from "vue"
import { authFetch, API_BASE_URL } from "@/utils/api"
import AppIconPicker from "@/components/AppIconPicker.vue"
import FaviconPicker from "@/components/FaviconPicker.vue"
const allowRegister = ref(true)
const siteTitle = ref("")
const siteIcp = ref("")
const snackbar = ref(false)
const snackMsg = ref("")
const showTitleDialog = ref(false)
const showIcpDialog = ref(false)
const titleInput = ref("")
const icpInput = ref("")
const showAppIconPicker = ref(false)
const showFaviconPicker = ref(false)

const serverConfig = ref({ version: "", port: "", tls: false, dataDir: "" })

async function loadSettings() {
  try {
    const r = await fetch(API_BASE_URL + "/api/settings")
    if (r.ok) {
      const s = await r.json()
      siteTitle.value = s.site_title || ""
      siteIcp.value = s.site_icp || ""
      document.title = s.site_title || "碎碎"
      allowRegister.value = s.allow_register !== "false"
    }
  } catch (err) { console.error("[AdminSystem] loadSettings failed:", err) }
  try {
    const r = await authFetch("/api/admin/config")
    if (r.ok) {
      const c = await r.json()
      serverConfig.value = { version: c.version || "", port: c.port || "", tls: false, dataDir: c.dataDir || "" }
    }
  } catch (err) { console.error("[AdminSystem] loadServerConfig failed:", err) }
}

function openTitleDialog() { titleInput.value = siteTitle.value; showTitleDialog.value = true }
function openIcpDialog() { icpInput.value = siteIcp.value; showIcpDialog.value = true }

async function saveSiteTitle() {
  try {
    await authFetch("/api/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "site_title", value: siteTitle.value.trim() })
    })
    document.title = siteTitle.value.trim() || "碎碎"
    snackMsg.value = "网站标题已保存"; snackbar.value = true; showTitleDialog.value = false
  } catch (err) { console.error("[AdminSystem] saveSiteTitle failed:", err); snackMsg.value = "保存失败"; snackbar.value = true }
}
async function saveSiteIcp() {
  try {
    await authFetch("/api/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "site_icp", value: siteIcp.value.trim() })
    })
    snackMsg.value = "备案号已保存"; snackbar.value = true; showIcpDialog.value = false
  } catch (err) { console.error("[AdminSystem] saveSiteIcp failed:", err); snackMsg.value = "保存失败"; snackbar.value = true }
}
async function toggleRegister(val: boolean) {
  try {
    await authFetch("/api/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "allow_register", value: val ? "true" : "false" })
    })
    snackMsg.value = val ? "已允许注册" : "已关闭注册"; snackbar.value = true
  } catch (err) { console.error("[AdminSystem] toggleRegister failed:", err); snackMsg.value = "操作失败"; snackbar.value = true }
}

loadSettings()
</script>

<template>
  <div class="settings-page">
    <v-snackbar v-model="snackbar" :timeout="2000" location="top right" color="success" variant="tonal">
      {{ snackMsg }}
    </v-snackbar>

    <!-- Site Settings -->
    <div class="settings-card">
      <div class="settings-card-header">
        <v-icon size="small" color="primary">mdi-tune</v-icon>
        <span>系统设置</span>
      </div>
      <div class="settings-body">
        <div class="setting-row">
          <div class="setting-label">
            <v-icon size="small" color="primary" class="setting-icon">mdi-web</v-icon>
            <div class="setting-text">
              <span class="setting-name">网站标题</span>
              <span class="setting-desc">{{ siteTitle || "未设置" }}</span>
            </div>
          </div>
          <v-btn size="small" variant="tonal" class="setting-btn" @click="openTitleDialog">修改</v-btn>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <v-icon size="small" color="primary" class="setting-icon">mdi-account-plus</v-icon>
            <div class="setting-text">
              <span class="setting-name">允许新用户注册</span>
              <span class="setting-desc">{{ allowRegister ? "已开启" : "已关闭" }}</span>
            </div>
          </div>
          <v-switch v-model="allowRegister" hide-details density="compact" color="primary" @update:model-value="(val: boolean | null) => toggleRegister(val ?? false)" />
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <v-icon size="small" color="primary" class="setting-icon">mdi-information</v-icon>
            <div class="setting-text">
              <span class="setting-name">备案号</span>
              <span class="setting-desc">{{ siteIcp || "未设置" }}</span>
            </div>
          </div>
          <v-btn size="small" variant="tonal" class="setting-btn" @click="openIcpDialog">修改</v-btn>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <v-icon size="small" color="primary" class="setting-icon">mdi-application</v-icon>
            <div class="setting-text">
              <span class="setting-name">应用图标</span>
              <span class="setting-desc">侧边栏顶部显示的应用图标</span>
            </div>
          </div>
          <v-btn size="small" variant="tonal" class="setting-btn" @click="showAppIconPicker = true">修改</v-btn>
        </div>

        <div class="setting-row">
          <div class="setting-label">
            <v-icon size="small" color="primary" class="setting-icon">mdi-star</v-icon>
            <div class="setting-text">
              <span class="setting-name">Favicon</span>
              <span class="setting-desc">浏览器标签栏图标</span>
            </div>
          </div>
          <v-btn size="small" variant="tonal" class="setting-btn" @click="showFaviconPicker = true">修改</v-btn>
        </div>
      </div>
    </div>

    <AppIconPicker v-model="showAppIconPicker" />
    <FaviconPicker v-model="showFaviconPicker" />

    <!-- Server Info -->
    <div class="settings-card server-card">
      <div class="settings-card-header">
        <v-icon size="small" color="primary">mdi-server</v-icon>
        <span>服务器信息</span>
      </div>
      <div class="settings-body">
        <div class="server-info-grid">
          <div class="server-info-item">
            <span class="server-info-label">版本</span>
            <span class="server-info-value">{{ serverConfig.version || "—" }}</span>
          </div>
          <div class="server-info-item">
            <span class="server-info-label">端口</span>
            <span class="server-info-value">{{ serverConfig.port || "—" }}</span>
          </div>
          <div class="server-info-item">
            <span class="server-info-label">数据目录</span>
            <span class="server-info-value server-info-path">{{ serverConfig.dataDir || "—" }}</span>
          </div>
          <div class="server-info-item">
            <span class="server-info-label">连接</span>
            <span class="server-info-value">{{ serverConfig.tls ? 'HTTPS' : 'HTTP' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Title Dialog -->
    <v-dialog v-model="showTitleDialog" max-width="400">
      <v-card class="rounded-xl pa-4 glass-dialog">
        <div class="d-flex align-center mb-3">
          <span class="text-subtitle-2 font-weight-medium">修改网站标题</span>
          <v-spacer />
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="showTitleDialog = false" />
        </div>
        <v-text-field v-model="titleInput" variant="outlined" hide-details density="compact" placeholder="网站标题" autofocus @keyup.enter="saveSiteTitle" />
        <div class="d-flex justify-end ga-2 mt-3">
          <v-btn variant="text" size="small" @click="showTitleDialog = false">取消</v-btn>
          <v-btn variant="tonal" color="primary" size="small" class="rounded-pill" @click="siteTitle = titleInput; saveSiteTitle()">保存</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ICP Dialog -->
    <v-dialog v-model="showIcpDialog" max-width="400">
      <v-card class="rounded-xl pa-4 glass-dialog">
        <div class="d-flex align-center mb-3">
          <span class="text-subtitle-2 font-weight-medium">修改备案号</span>
          <v-spacer />
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="showIcpDialog = false" />
        </div>
        <v-text-field v-model="icpInput" variant="outlined" hide-details density="compact" placeholder="沪ICP备xxxxxxxx号" autofocus @keyup.enter="saveSiteIcp" />
        <div class="d-flex justify-end ga-2 mt-3">
          <v-btn variant="text" size="small" @click="showIcpDialog = false">取消</v-btn>
          <v-btn variant="tonal" color="primary" size="small" class="rounded-pill" @click="siteIcp = icpInput; saveSiteIcp()">保存</v-btn>
        </div>
      </v-card>
</v-dialog>
</div>
</template>

<style scoped>
.settings-page {
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

/* Server info grid */
.server-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding: 12px 20px;
}
.server-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
}
.server-info-label {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.4);
}
.server-info-value {
  font-size: 0.88rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}
.server-info-path {
  font-size: 0.78rem;
  font-family: var(--code-font);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Dialog */
.glass-dialog {
  background: rgba(var(--v-theme-surface), 0.92) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

@media (max-width: 768px) {
  .setting-row { padding: 10px 14px; }
  .settings-card-header { padding: 12px 14px; }
  .server-info-grid { padding: 8px 14px; }
}
</style>
