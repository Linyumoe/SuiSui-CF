<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { authFetch } from "@/utils/api"
import AdminProfile from "@/components/AdminProfile.vue"
import AdminSystem from "@/components/AdminSystem.vue"

const router = useRouter()
const auth = useAuthStore()

interface AdminStats {
  totalUsers: number
  totalNotes: number
}
interface AdminUser {
  id: number
  username: string
  nickname: string
  role: string
  memoCount: number
  createdAt: number
}

const tab = ref("overview")
const stats = ref<AdminStats | null>(null)
const users = ref<AdminUser[]>([])
const loading = ref(false)
const deleting = ref<null | number>(null)
const showDeleteDialog = ref(false)
const deleteTarget = ref<number | null>(null)

watch(tab, () => window.scrollTo(0, 0))

onMounted(() => {
  if (auth.userRole !== "admin") tab.value = "profile"
  else { loadData() }
})

watch(() => auth.userRole, (val) => { if (val !== "admin") tab.value = "profile" })

async function loadData() {
  loading.value = true
  await Promise.all([loadStats(), loadUsers()])
  loading.value = false
}
async function loadStats() {
  try { const r = await authFetch("/api/admin/stats"); if (r.ok) stats.value = await r.json() } catch { console.warn("loadStats failed") }
}
const userPage = ref(1)
const userTotal = ref(0)
const userPerPage = ref(10)

async function loadUsers() {
  try { const r = await authFetch("/api/admin/users?page=" + userPage.value + "&per_page=" + userPerPage.value); if (r.ok) { const d = await r.json(); users.value = d.users || []; userTotal.value = d.total || 0 } } catch { console.warn("loadUsers failed") }
}
function prevPage() { if (userPage.value > 1) { userPage.value--; loadUsers() } }
function nextPage() { if (userPage.value * userPerPage.value < userTotal.value) { userPage.value++; loadUsers() } }
function confirmDelete(id: number) {
  deleteTarget.value = id
  showDeleteDialog.value = true
}

async function doDelete() {
  const id = deleteTarget.value
  if (id === null) return
  showDeleteDialog.value = false
  deleting.value = id
  try { await authFetch("/api/admin/users/" + id, { method: "DELETE" }); await loadData() } catch { console.warn("deleteUser failed") }
  deleting.value = null
  deleteTarget.value = null
}
function formatDate(ts: number) { return new Date(ts).toLocaleString("zh-CN") }
</script>

<template>
  <div class="admin-page">
    <div class="admin-header">
      <v-btn icon="mdi-arrow-left" variant="text" size="small" class="back-btn" @click="router.push('/')" />
      <div class="admin-title-area">
        <h1 class="admin-title">后台管理</h1>
        <p class="admin-subtitle">管理用户与碎片笔记</p>
      </div>
      <v-spacer />
      <v-btn prepend-icon="mdi-refresh" variant="tonal" size="small" :loading="loading" class="refresh-btn" @click="loadData">刷新</v-btn>
    </div>

    <div class="admin-tabs" role="tablist">
      <button v-if="auth.isAdmin" :class="['tab-item', { active: tab === 'overview' }]" role="tab" :aria-selected="tab === 'overview'" @click="tab = 'overview'">
        <v-icon size="small" class="tab-icon">mdi-view-dashboard</v-icon>
        <span>概览</span>
      </button>
      <button v-if="auth.isAdmin" :class="['tab-item', { active: tab === 'system' }]" role="tab" :aria-selected="tab === 'system'" @click="tab = 'system'">
        <v-icon size="small" class="tab-icon">mdi-cog</v-icon>
        <span>系统设置</span>
      </button>
      <button v-if="auth.isAdmin" :class="['tab-item', { active: tab === 'users' }]" role="tab" :aria-selected="tab === 'users'" @click="tab = 'users'">
        <v-icon size="small" class="tab-icon">mdi-account-group</v-icon>
        <span>用户管理</span>
      </button>
      <button :class="['tab-item', { active: tab === 'profile' }]" role="tab" :aria-selected="tab === 'profile'" @click="tab = 'profile'">
        <v-icon size="small" class="tab-icon">mdi-account</v-icon>
        <span>个人资料</span>
      </button>
    </div>

    <Transition name="fade" mode="out-in">
      <div :key="tab" class="tab-content">
        <!-- === Overview Tab === -->
        <template v-if="tab === 'overview' && auth.isAdmin">
          <div class="stats-grid">
            <div class="stat-card stat-users">
              <div class="stat-icon-wrap">
                <v-icon size="28">mdi-account</v-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">用户总数</span>
                <span class="stat-value">{{ stats?.totalUsers || 0 }}</span>
              </div>
            </div>
            <div class="stat-card stat-notes">
              <div class="stat-icon-wrap">
                <v-icon size="28">mdi-pencil-box-multiple</v-icon>
              </div>
              <div class="stat-info">
                <span class="stat-label">碎片笔记</span>
                <span class="stat-value">{{ stats?.totalNotes || 0 }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- === System Tab === -->
        <template v-if="tab === 'system' && auth.isAdmin">
          <AdminSystem />
        </template>

        <!-- === Users Tab === -->
        <template v-if="tab === 'users' && auth.isAdmin">
          <div class="users-card">
            <div class="users-card-header">
              <v-icon size="small" color="primary">mdi-account-group</v-icon>
              <span class="users-card-title">用户管理</span>
              <span class="users-count-badge">{{ userTotal }}</span>
            </div>

            <div v-if="loading" class="loading-area">
              <v-progress-circular indeterminate color="primary" size="36" />
            </div>

            <div v-else-if="!users.length" class="empty-area">
              <v-icon size="40" color="disabled">mdi-account-off</v-icon>
              <span class="text-body-2 text-medium-emphasis mt-2">暂无用户</span>
            </div>

            <div v-else class="users-list">
              <div v-for="u in users" :key="u.id" class="user-item">
                <div class="user-item-left">
                  <v-avatar size="38" :color="u.role === 'admin' ? 'warning' : 'primary'" variant="tonal">
                    <span class="text-body-2 font-weight-medium">{{ u.nickname?.charAt(0)?.toUpperCase() || u.username.charAt(0).toUpperCase() }}</span>
                  </v-avatar>
                  <div class="user-item-info">
                    <div class="user-item-name">
                      <span>{{ u.nickname || u.username }}</span>
                      <span v-if="u.role === 'admin'" class="admin-badge">管理员</span>
                    </div>
                    <div class="user-item-meta">
                      @{{ u.username }} · {{ u.memoCount }} 条备忘 · {{ formatDate(u.createdAt) }}
                    </div>
                  </div>
                </div>
                <v-btn v-if="u.role !== 'admin'" icon="mdi-delete-outline" size="small" variant="text" color="error"
                  :loading="deleting === u.id" class="delete-user-btn" @click="confirmDelete(u.id)" />
              </div>
            </div>

            <div v-if="users.length" class="pagination-bar">
              <v-btn size="small" variant="tonal" class="page-btn" :disabled="userPage <= 1" @click="prevPage">
                <v-icon size="x-small">mdi-chevron-left</v-icon> 上一页
              </v-btn>
              <span class="page-info">{{ userPage }} / {{ Math.ceil(userTotal / userPerPage) || 1 }}</span>
              <v-btn size="small" variant="tonal" class="page-btn" :disabled="userPage * userPerPage >= userTotal" @click="nextPage">
                下一页 <v-icon size="x-small">mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </div>
        </template>

        <!-- === Profile Tab === -->
        <template v-if="tab === 'profile'">
          <AdminProfile />
</template>
</div>
    </Transition>

    <v-dialog v-model="showDeleteDialog" max-width="380">
      <v-card class="rounded-xl pa-4 delete-dialog-card">
        <div class="d-flex align-center mb-3">
          <v-icon color="error" class="mr-2">mdi-alert-circle-outline</v-icon>
          <span class="text-subtitle-2 font-weight-medium">确认删除</span>
          <v-spacer />
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="showDeleteDialog = false" />
        </div>
        <p class="text-body-2 mb-4 text-medium-emphasis">确定要删除此用户吗？此操作不可撤销，该用户的所有笔记也将被删除。</p>
        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" size="small" @click="showDeleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" size="small" :loading="deleting !== null" class="rounded-pill" @click="doDelete">确认删除</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.admin-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
}

/* Header */
.admin-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  gap: 12px;
}
.back-btn {
  opacity: 0.55;
  transition: opacity 0.2s;
}
.back-btn:hover { opacity: 1; }
.admin-title-area { flex: 1; }
.admin-title {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
}
.admin-subtitle {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-top: 2px;
}
.refresh-btn { border-radius: 10px; }

/* Custom Tabs */
.admin-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: rgba(var(--v-theme-surface), 0.4);
  border-radius: 12px;
  padding: 4px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.5);
  cursor: pointer;
  font-size: 0.85rem;
  font-family: inherit;
  transition: all 0.2s ease;
}
.tab-item:hover { color: rgb(var(--v-theme-on-surface)); background: rgba(var(--v-theme-primary), 0.04); }
.tab-item.active {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  font-weight: 600;
}
.tab-icon { transition: transform 0.2s; }
.tab-item.active .tab-icon { transform: scale(1.1); }

.tab-content { min-height: 200px; }

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 14px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.stat-users {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08) 0%, rgba(var(--v-theme-primary), 0.02) 100%);
}
.stat-notes {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.02) 100%);
}
.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}
.stat-notes .stat-icon-wrap { background: rgba(76, 175, 80, 0.1); color: #4CAF50; }
.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
}

/* Users Card */
.users-card {
  background: rgba(var(--v-theme-surface), 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  overflow: hidden;
}
.users-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.users-card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}
.users-count-badge {
  margin-left: auto;
  font-size: 0.75rem;
  padding: 2px 10px;
  border-radius: 20px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}
.loading-area, .empty-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
}

/* User List */
.users-list { display: flex; flex-direction: column; }
.user-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  gap: 12px;
  transition: background 0.15s;
}
.user-item:hover { background: rgba(var(--v-theme-primary), 0.03); }
.user-item + .user-item { border-top: 1px solid rgba(var(--v-theme-on-surface), 0.04); }
.user-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.user-item-info { min-width: 0; }
.user-item-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}
.admin-badge {
  font-size: 0.65rem;
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(255, 152, 0, 0.15);
  color: #FF9800;
  font-weight: 500;
}
.user-item-meta {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.4);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.delete-user-btn {
  opacity: 0.4;
  transition: opacity 0.2s;
  flex-shrink: 0;
}
.user-item:hover .delete-user-btn { opacity: 0.8; }
.delete-user-btn:hover { opacity: 1 !important; }

/* Pagination */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.page-btn { border-radius: 8px; }
.page-info {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  min-width: 60px;
  text-align: center;
}

/* Delete Dialog */
.delete-dialog-card {
  background: rgba(var(--v-theme-surface), 0.92) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.12s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Mobile */
@media (max-width: 768px) {
  .admin-page { padding: 12px; }
  .admin-tabs { gap: 2px; padding: 3px; }
  .tab-item { font-size: 0.78rem; padding: 6px 8px; gap: 4px; }
  .stats-grid { grid-template-columns: 1fr; }
  .user-item { padding: 10px 14px; }
  .user-item-meta { font-size: 0.7rem; }
}
</style>
