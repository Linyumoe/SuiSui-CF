import { createRouter, createWebHistory } from "vue-router"
import type { RouteRecordRaw } from "vue-router"
import NotesPage from "@/views/NotesPage.vue"
import AdminPage from "@/views/AdminPage.vue"
import ShareView from "@/components/ShareView.vue"
import LoginPage from "@/views/LoginPage.vue"
import SettingsPage from "@/views/SettingsPage.vue"
import { useAuthStore } from "@/stores/auth"

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "notes",
    component: NotesPage,
    meta: { title: "碎碎 SuiSui" },
  },
  {
    path: "/admin",
    name: "admin",
    component: AdminPage,
    meta: { title: "后台管理 - 碎碎 SuiSui", requiresAdmin: true },
  },
  {
    path: "/share/:token",
    name: "share",
    component: ShareView,
    meta: { standalone: true, title: "分享 - 碎碎 SuiSui" },
  },
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: { standalone: true, title: "登录 - 碎碎 SuiSui" },
  },
  {
    path: "/settings",
    name: "settings",
    component: SettingsPage,
    meta: { standalone: true, title: "设置 - 碎碎 SuiSui" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAdmin) {
    const auth = useAuthStore()
    if (!auth.isLoggedIn || !auth.isAdmin) {
      return "/"
    }
  }
})

router.afterEach((to) => {
  if (to.meta && typeof to.meta.title === "string") {
    document.title = to.meta.title
  }
})

export default router
