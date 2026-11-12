<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Command } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import { useAuth } from '@/stores/auth'
import { mockMode } from '@/lib/repository'
const username = ref(mockMode ? 'admin' : ''),
  password = ref(mockMode ? 'admin123' : ''),
  error = ref(''),
  busy = ref(false),
  auth = useAuth(),
  router = useRouter(),
  route = useRoute()
async function login() {
  busy.value = true
  error.value = ''
  try {
    await auth.login(username.value, password.value)
    const redirect = String(route.query.redirect || '/')
    await router.replace(redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="flex min-h-svh flex-col items-center justify-center bg-background px-4">
    <div class="mb-8 flex items-center gap-2 text-xl font-semibold">
      <Command class="size-6" />Shadcn Admin
    </div>
    <div class="w-full max-w-sm rounded-xl border p-6 shadow-sm">
      <h1 class="text-center text-2xl font-semibold tracking-tight">欢迎回来</h1>
      <p class="mt-2 text-center text-sm text-muted-foreground">输入你的账号和密码，登录管理平台</p>
      <form class="mt-6 space-y-4" @submit.prevent="login">
        <div class="space-y-2">
          <label for="username" class="text-sm font-medium">账号</label
          ><Input id="username" v-model="username" autocomplete="username" required />
        </div>
        <div class="space-y-2">
          <label for="password" class="text-sm font-medium">密码</label
          ><Input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>
        <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
        <Button type="submit" class="w-full" :disabled="busy">{{
          busy ? '登录中…' : '登录'
        }}</Button>
      </form>
      <div
        v-if="mockMode"
        class="mt-5 rounded-md bg-muted/60 p-3 text-xs leading-6 text-muted-foreground"
      >
        演示账号：admin / viewer<br />统一密码：admin123<br />仅用于前端演示，不连接真实身份服务。
      </div>
    </div>
    <p class="mt-6 text-xs text-muted-foreground">Vue 3 + shadcn-vue · 通用后台管理模板</p>
  </div>
</template>
