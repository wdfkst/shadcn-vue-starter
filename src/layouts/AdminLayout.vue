<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Command,
  PanelLeft,
  Search,
  Sun,
  Moon,
  Settings2,
  LayoutDashboard,
  Users,
  Shield,
  Menu,
  Building2,
  BookOpen,
  FileClock,
  LogIn,
  Code2,
  Settings,
  ChevronRight,
  Box,
  X,
} from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import Input from '@/components/ui/input/Input.vue'
import UserMenu from '@/components/layout/UserMenu.vue'
import { useAuth } from '@/stores/auth'
import { usePreferences } from '@/stores/preferences'
import { useSystem } from '@/stores/system'
import { mockMode } from '@/lib/repository'
const auth = useAuth(),
  prefs = usePreferences(),
  system = useSystem(),
  route = useRoute(),
  router = useRouter(),
  mobile = ref(false),
  searchOpen = ref(false),
  settingsOpen = ref(false),
  term = ref('')
const icons: Record<string, any> = {
  dashboard: LayoutDashboard,
  users: Users,
  roles: Shield,
  menus: Menu,
  departments: Building2,
  dictionaries: BookOpen,
  'operation-logs': FileClock,
  'login-logs': LogIn,
  box: Box,
  generator: Code2,
  settings: Settings,
}
const links = computed(() =>
  system.navigation
    .filter((item) => !item.permission || auth.can(item.permission))
    .map((item) => ({ ...item, icon: icons[item.icon ?? ''] ?? Box })),
)
const groups = computed(() => [...new Set(links.value.map((l) => l.group))])
const results = computed(() =>
  links.value.filter((l) => l.title.toLowerCase().includes(term.value.toLowerCase())),
)
function navigate(path: string) {
  router.push(path)
  searchOpen.value = false
  mobile.value = false
}
function toggleSidebar() {
  if (window.innerWidth < 768) mobile.value = !mobile.value
  else prefs.collapsed = !prefs.collapsed
}
function shortcut(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    searchOpen.value = !searchOpen.value
  }
}
onMounted(() => window.addEventListener('keydown', shortcut))
onUnmounted(() => window.removeEventListener('keydown', shortcut))
watch(
  () => route.path,
  () => (mobile.value = false),
)
</script>
<template>
  <div class="min-h-svh" :class="prefs.inset ? 'bg-sidebar-accent/40' : ''">
    <a
      href="#main"
      class="sr-only z-[100] rounded bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed"
      >跳转到内容</a
    >
    <button
      v-if="mobile"
      class="fixed inset-0 z-40 bg-black/50 md:hidden"
      aria-label="关闭导航"
      @click="mobile = false"
    />
    <aside
      class="fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200"
      :class="[
        prefs.collapsed ? 'md:w-[3.25rem]' : 'md:w-64',
        mobile ? 'w-72 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0',
        prefs.inset ? 'p-2' : 'border-r',
      ]"
    >
      <button
        class="flex h-14 items-center gap-2 rounded-md px-2 text-left hover:bg-sidebar-accent"
        @click="navigate('/')"
      >
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
          ><Command class="size-4" /></span
        ><span class="min-w-0 flex-1" :class="prefs.collapsed ? 'md:hidden' : ''"
          ><span class="block truncate text-sm font-semibold">Shadcn Admin</span
          ><span class="block text-xs text-muted-foreground">Vue 管理平台</span></span
        >
      </button>
      <nav class="flex-1 overflow-y-auto px-2 py-2">
        <div v-for="group in groups" :key="group" class="mb-4">
          <p
            class="px-2 py-2 text-xs font-medium text-muted-foreground"
            :class="prefs.collapsed ? 'md:hidden' : ''"
          >
            {{ group }}
          </p>
          <button
            v-for="link in links.filter((l) => l.group === group)"
            :key="link.path"
            :title="link.title"
            :aria-current="route.path === link.path ? 'page' : undefined"
            class="my-0.5 flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors hover:bg-sidebar-accent"
            :class="route.path === link.path ? 'bg-sidebar-accent font-medium' : ''"
            @click="navigate(link.path)"
          >
            <component :is="link.icon" class="size-4 shrink-0" /><span
              :class="prefs.collapsed ? 'md:hidden' : ''"
              >{{ link.title }}</span
            ><ChevronRight
              v-if="route.path === link.path"
              class="ml-auto size-3"
              :class="prefs.collapsed ? 'md:hidden' : ''"
            />
          </button>
        </div>
      </nav>
      <div class="px-2 py-2">
        <UserMenu :compact="prefs.collapsed" />
      </div>
    </aside>
    <div
      class="min-h-svh transition-[margin] duration-200"
      :class="[
        prefs.collapsed ? 'md:ml-[3.25rem]' : 'md:ml-64',
        prefs.inset ? 'md:py-2 md:pr-2' : '',
      ]"
    >
      <div
        class="min-h-svh bg-background"
        :class="
          prefs.inset ? 'md:min-h-[calc(100svh-1rem)] md:rounded-xl md:border md:shadow-xs' : ''
        "
      >
        <header
          class="sticky top-0 z-30 flex h-16 items-center gap-3 bg-background/95 px-4 backdrop-blur-sm"
        >
          <Button variant="outline" size="icon" aria-label="切换侧栏" @click="toggleSidebar"
            ><PanelLeft class="size-4" /></Button
          ><span class="h-6 w-px bg-border" />
          <Button
            variant="outline"
            class="h-8 text-muted-foreground sm:w-56 sm:justify-start"
            @click="searchOpen = true"
            ><Search class="size-4" /><span class="hidden sm:inline">搜索菜单…</span
            ><kbd class="ml-auto hidden rounded border px-1 text-[10px] sm:inline">⌘ K</kbd></Button
          ><div class="hidden gap-5 text-sm sm:flex">
            <button
              :class="route.path === '/' ? 'font-medium' : 'text-muted-foreground hover:text-foreground'"
              @click="navigate('/')"
            >
              概览
            </button>
            <button
              :class="
                route.path.startsWith('/system')
                  ? 'font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              "
              @click="navigate('/system/users')"
            >
              系统管理
            </button>
            <button
              v-if="auth.can('generator:create')"
              :class="
                route.path.startsWith('/tools')
                  ? 'font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              "
              @click="navigate('/tools/generator')"
            >
              开发工具
            </button>
          </div>
          <span class="flex-1" /><Button
            variant="ghost"
            size="icon"
            aria-label="切换主题"
            @click="prefs.theme = prefs.theme === 'dark' ? 'light' : 'dark'"
            ><Sun v-if="prefs.theme === 'light'" class="size-5" /><Moon
              v-else
              class="size-5" /></Button
          ><Button variant="ghost" size="icon" aria-label="布局设置" @click="settingsOpen = true"
            ><Settings2 class="size-5" /></Button
          ><UserMenu compact />
        </header>
        <main id="main" class="mx-auto w-full px-4 pb-8"><RouterView /></main>
      </div>
    </div>
    <Dialog
      v-model:open="searchOpen"
      title="搜索菜单"
      description="输入名称快速跳转，快捷键 Ctrl / ⌘ K。"
      ><Input v-model="term" placeholder="搜索页面…" autofocus />
      <div class="max-h-80 overflow-y-auto">
        <button
          v-for="item in results"
          :key="item.path"
          class="flex w-full items-center gap-3 rounded-md p-3 text-left text-sm hover:bg-accent"
          @click="navigate(item.path)"
        >
          <component :is="item.icon" class="size-4" />{{ item.title
          }}<span class="ml-auto text-xs text-muted-foreground">{{ item.group }}</span>
        </button>
        <p v-if="!results.length" class="p-5 text-center text-muted-foreground">没有匹配的菜单</p>
      </div></Dialog
    >
    <Dialog
      v-model:open="settingsOpen"
      title="布局设置"
      description="调整你的工作空间，设置仅保存在当前浏览器。"
      ><div class="space-y-5">
        <div class="flex items-center justify-between">
          <span class="text-sm">深色模式</span
          ><input
            v-model="prefs.theme"
            type="checkbox"
            true-value="dark"
            false-value="light"
            aria-label="深色模式"
          />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm">折叠侧边栏</span
          ><input v-model="prefs.collapsed" type="checkbox" aria-label="折叠侧边栏" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm">内嵌布局</span
          ><input v-model="prefs.inset" type="checkbox" aria-label="内嵌布局" />
        </div>
        <Button
          variant="outline"
          class="w-full"
          @click="() => { prefs.theme = 'light'; prefs.collapsed = false; prefs.inset = false }"
          >恢复默认</Button
        >
      </div></Dialog
    >
  </div>
</template>
