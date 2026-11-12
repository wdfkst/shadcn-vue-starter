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
  confirm = ref(''),
  mode = ref<'login' | 'register'>('login'),
  error = ref(''),
  success = ref(''),
  busy = ref(false),
  auth = useAuth(),
  router = useRouter(),
  route = useRoute()

function switchMode(next: 'login' | 'register') {
  mode.value = next
  error.value = ''
  success.value = ''
  confirm.value = ''
  username.value = next === 'login' && mockMode ? 'admin' : ''
  password.value = next === 'login' && mockMode ? 'admin123' : ''
}

async function submit() {
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    if (mode.value === 'register') {
      if (!username.value.trim() || !password.value || !confirm.value) throw Error('请填写所有字段')
      if (password.value !== confirm.value) throw Error('两次输入的密码不一致')
      await auth.register(username.value, password.value)
      success.value = '注册成功，请登录'
      mode.value = 'login'
      password.value = ''
      confirm.value = ''
      return
    }
    if (!username.value.trim() || !password.value) throw Error('请输入用户名和密码')
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
  <div class="grid min-h-svh lg:grid-cols-[3fr_2fr]">
    <section class="relative hidden overflow-hidden bg-[#0b1220] lg:block" aria-hidden="true">
      <img
        :src="'/login-illustration.png'"
        alt=""
        class="absolute inset-0 size-full object-cover"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />
      <div
        class="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_10%,rgba(99,102,241,0.25),transparent_55%),radial-gradient(90%_70%_at_85%_90%,rgba(56,189,248,0.2),transparent_60%),linear-gradient(160deg,rgba(11,18,32,0.35)_0%,rgba(17,26,46,0.15)_100%)]"
      />
      <div
        class="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(70%_60%_at_50%_45%,black,transparent)]"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-[#0b1220]/80 via-transparent to-transparent" />
      <div class="relative flex h-full flex-col justify-between p-10 text-white">
        <div class="flex items-center gap-2 text-lg font-semibold">
          <Command class="size-5" />Shadcn Admin
        </div>
        <div>
          <p class="text-2xl font-semibold tracking-tight">一个开箱即用的通用后台模板</p>
          <p class="mt-2 max-w-md text-sm text-white/70">
            权限、菜单、字典与页面生成器，帮你快速搭建业务管理系统。
          </p>
        </div>
      </div>
    </section>

    <section class="flex flex-col items-center justify-center bg-background px-6 py-12">
      <div class="mb-8 flex items-center gap-2 text-xl font-semibold lg:hidden">
        <Command class="size-6" />Shadcn Admin
      </div>
      <div class="w-full max-w-sm">
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ mode === 'login' ? '欢迎回来' : '创建账号' }}
        </h1>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ mode === 'login' ? '输入你的账号和密码，登录管理平台' : '注册后即可登录管理平台' }}
        </p>

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
          <div class="space-y-2">
            <label for="username" class="text-sm font-medium">账号</label>
            <Input id="username" v-model="username" autocomplete="username" />
          </div>
          <div class="space-y-2">
            <label for="password" class="text-sm font-medium">密码</label>
            <Input
              id="password"
              v-model="password"
              type="password"
              :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            />
          </div>
          <div v-if="mode === 'register'" class="space-y-2">
            <label for="confirm" class="text-sm font-medium">确认密码</label>
            <Input id="confirm" v-model="confirm" type="password" autocomplete="new-password" />
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
