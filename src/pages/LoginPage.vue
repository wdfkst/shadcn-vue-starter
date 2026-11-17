<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Command } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import { useAuth } from '@/stores/auth'
import { mockMode } from '@/lib/repository'

const username = ref(mockMode ? 'admin' : ''),
  password = ref(mockMode ? 'admin123' : ''),
  confirm = ref(''),
  mode = ref<'login' | 'register'>('login'),
  fieldErrors = reactive<Record<string, string>>({}),
  error = ref(''),
  success = ref(''),
  busy = ref(false),
  auth = useAuth(),
  router = useRouter(),
  route = useRoute()

function switchMode(next: 'login' | 'register') {
  mode.value = next
  error.value = ''
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  success.value = ''
  confirm.value = ''
  username.value = next === 'login' && mockMode ? 'admin' : ''
  password.value = next === 'login' && mockMode ? 'admin123' : ''
}

async function submit() {
  busy.value = true
  error.value = ''
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  success.value = ''
  try {
    if (!username.value.trim()) fieldErrors.username = '请输入账号'
    if (!password.value) fieldErrors.password = '请输入密码'
    if (mode.value === 'register') {
      if (!confirm.value) fieldErrors.confirm = '请再次输入密码'
      else if (password.value !== confirm.value) fieldErrors.confirm = '两次输入的密码不一致'
    }
    if (Object.keys(fieldErrors).length) return
    if (mode.value === 'register') {
      await auth.register(username.value, password.value)
      success.value = '注册成功，请登录'
      mode.value = 'login'
      password.value = ''
      confirm.value = ''
      return
    }
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
  <div class="relative isolate grid min-h-svh bg-background lg:grid-cols-[3fr_2fr]">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div class="absolute -top-24 -left-24 h-[70%] w-[65%] rounded-full bg-violet-300/30 blur-[100px] dark:bg-violet-400/10" />
      <div class="absolute right-0 bottom-0 h-[65%] w-[55%] rounded-full bg-emerald-200/30 blur-[100px] dark:bg-emerald-400/10" />
      <div class="absolute top-1/3 left-1/3 h-72 w-72 rounded-full bg-amber-200/25 blur-[90px] dark:bg-amber-300/5" />
    </div>
    <section class="hidden lg:flex lg:flex-col" aria-hidden="true">
      <div class="flex items-center gap-2 px-10 pt-10 text-lg font-semibold">
        <Command class="size-5" />Shadcn Admin
      </div>
      <div class="flex flex-1 flex-col items-center justify-center gap-6 px-10 py-10">
        <img
          src="/illustrations/login-scene.png"
          alt=""
          class="h-[min(48vh,440px)] w-full max-w-md object-contain"
        />
        <div class="max-w-md text-center">
          <p class="text-3xl font-semibold tracking-tight">你的工作空间，准备就绪</p>
          <p class="mt-3 text-sm leading-7 text-muted-foreground">
            从日常管理到搭建新页面，让每一次开始都简单一点。
          </p>
        </div>
      </div>
      <p class="px-10 pb-8 text-xs text-muted-foreground">管理业务，从这里开始。</p>
    </section>

    <section class="flex flex-col items-center justify-center px-6 py-12 lg:pr-10">
      <div class="mb-8 flex items-center gap-2 text-xl font-semibold lg:hidden">
        <Command class="size-6" />Shadcn Admin
      </div>
      <div class="relative w-full max-w-md rounded-2xl border border-border/70 bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-8">
        <div class="pointer-events-none absolute -top-3 right-8 size-5 rotate-12 rounded-md border bg-muted" aria-hidden="true" />
        <div class="pointer-events-none absolute top-12 -right-2 size-3 rounded-full border bg-background" aria-hidden="true" />
        <div class="flex items-center gap-2 border-b pb-5">
          <div class="min-w-0 flex-1">
            <p class="mb-2 text-xs font-medium text-muted-foreground">你的专属工作空间</p>
            <h1 class="text-2xl font-semibold tracking-tight">
              {{ mode === 'login' ? '欢迎回来' : '创建账号' }}
            </h1>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              {{ mode === 'login' ? '登录后，继续今天的工作。' : '创建账号，开启新的工作空间。' }}
            </p>
          </div>
          <img
            src="/illustrations/login-mascot.png"
            alt=""
            class="h-28 w-24 shrink-0 object-contain sm:h-32 sm:w-28"
          />
        </div>

        <div class="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
          <button
            type="button"
            class="rounded-md py-1.5 transition-colors"
            :class="mode === 'login' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'"
            @click="switchMode('login')"
          >
            登录
          </button>
          <button
            type="button"
            class="rounded-md py-1.5 transition-colors"
            :class="mode === 'register' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'"
            @click="switchMode('register')"
          >
            注册
          </button>
        </div>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <div class="space-y-1.5">
            <label for="username" class="text-sm font-medium">账号</label>
            <Input
              id="username"
              v-model="username"
              autocomplete="username"
              :aria-invalid="!!fieldErrors.username || undefined"
            />
            <p v-if="fieldErrors.username" role="alert" class="text-sm text-destructive">
              {{ fieldErrors.username }}
            </p>
          </div>
          <div class="space-y-1.5">
            <label for="password" class="text-sm font-medium">密码</label>
            <Input
              id="password"
              v-model="password"
              type="password"
              :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
              :aria-invalid="!!fieldErrors.password || undefined"
            />
            <p v-if="fieldErrors.password" role="alert" class="text-sm text-destructive">
              {{ fieldErrors.password }}
            </p>
          </div>
          <div v-if="mode === 'register'" class="space-y-1.5">
            <label for="confirm" class="text-sm font-medium">确认密码</label>
            <Input
              id="confirm"
              v-model="confirm"
              type="password"
              autocomplete="new-password"
              :aria-invalid="!!fieldErrors.confirm || undefined"
            />
            <p v-if="fieldErrors.confirm" role="alert" class="text-sm text-destructive">
              {{ fieldErrors.confirm }}
            </p>
          </div>
          <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
          <p v-if="success" role="status" class="text-sm text-muted-foreground">{{ success }}</p>
          <Button type="submit" class="w-full" :disabled="busy">
            {{ busy ? '处理中…' : mode === 'login' ? '登录' : '注册' }}
          </Button>
        </form>

        <div
          v-if="mockMode && mode === 'login'"
          class="mt-5 rounded-md bg-muted/60 p-3 text-xs leading-6 text-muted-foreground"
        >
          演示账号：admin / viewer<br />统一密码：admin123<br />仅用于前端演示，不连接真实身份服务。
        </div>
        <p class="mt-6 text-center text-xs text-muted-foreground">Vue 3 + shadcn-vue · 通用后台管理模板</p>
      </div>
    </section>
  </div>
</template>
