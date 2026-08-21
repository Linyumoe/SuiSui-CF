<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { API_BASE_URL } from "@/utils/api"
import AppLogo from "@/components/AppLogo.vue"

const router = useRouter()
const auth = useAuthStore()

const isRegister = ref(false)
const loginUsername = ref("")
const loginPassword = ref("")
const loginConfirm = ref("")
const loginError = ref("")
const showPwd = ref(false)
const allowRegister = ref(true)
const submitting = ref(false)

onMounted(async () => {
  if (auth.isLoggedIn) {
    router.replace("/")
    return
  }
  try {
    const r = await fetch(API_BASE_URL + "/api/settings")
    if (r.ok) { const s = await r.json(); allowRegister.value = s.allow_register !== "false" }
  } catch (err) { console.error("[LoginPage] failed to load settings:", err) }
})

async function handleAuth() {
  loginError.value = ""
  submitting.value = true
  try {
    if (isRegister.value) {
      if (loginPassword.value !== loginConfirm.value) { loginError.value = "两次密码不一致"; submitting.value = false; return }
      const err = await auth.register(loginUsername.value, loginPassword.value)
      if (err) { loginError.value = err; submitting.value = false; return }
    } else {
      const err = await auth.login(loginUsername.value, loginPassword.value)
      if (err) { loginError.value = err; submitting.value = false; return }
    }
    router.replace("/")
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <AppLogo :size="36" />
        <h1 class="login-title">碎碎 SuiSui</h1>
        <p class="login-subtitle">{{ isRegister ? '创建你的账号' : '登录你的账号' }}</p>
      </div>

      <v-card class="login-card" rounded="xl">
        <v-card-text class="pa-6">
          <v-alert v-if="loginError" :text="loginError" type="error" variant="tonal" density="compact" closable class="mb-4 rounded-lg" @click:close="loginError = ''" />

          <v-form @submit.prevent="handleAuth">
            <v-text-field v-model="loginUsername" label="用户名" variant="outlined" density="comfortable" hide-details class="mb-4" prepend-inner-icon="mdi-account-outline" autocomplete="username" name="username" />

            <v-text-field v-model="loginPassword" :type="showPwd ? 'text' : 'password'" label="密码" variant="outlined" density="comfortable" hide-details class="mb-4" prepend-inner-icon="mdi-lock-outline" :autocomplete="isRegister ? 'new-password' : 'current-password'" spellcheck="false">
              <template #append-inner>
                <v-btn :icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'" size="x-small" variant="text" @click.stop="showPwd = !showPwd" />
              </template>
            </v-text-field>

            <v-text-field v-if="isRegister" v-model="loginConfirm" :type="showPwd ? 'text' : 'password'" label="确认密码" variant="outlined" density="comfortable" hide-details class="mb-4" prepend-inner-icon="mdi-lock-outline" autocomplete="new-password" spellcheck="false" />

            <v-btn type="submit" color="primary" variant="flat" size="large" block class="rounded-pill mt-2"
              :loading="submitting" :disabled="isRegister && !allowRegister">
              {{ isRegister && !allowRegister ? '注册已关闭' : (isRegister ? '注册并登录' : '登录') }}
            </v-btn>
          </v-form>

          <div class="login-footer">
            <v-btn v-if="allowRegister" variant="text" size="small" class="text-caption text-medium-emphasis"
              @click="isRegister = !isRegister; loginError = ''">
              {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div class="login-back">
        <v-btn variant="text" size="small" class="text-caption text-medium-emphasis" prepend-icon="mdi-arrow-left" @click="router.push('/')">
          返回首页
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(var(--v-theme-primary), 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(var(--v-theme-primary), 0.04) 0%, transparent 50%),
    rgb(var(--v-theme-background));
}
.login-container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}
.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}
.login-subtitle {
  font-size: 0.88rem;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 0;
}
.login-card {
  width: 100%;
  background: rgba(var(--v-theme-surface), 0.85) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.login-footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
.login-back {
  display: flex;
  justify-content: center;
}
</style>
