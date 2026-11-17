<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Building2,
  Code2,
  FileClock,
  LayoutDashboard,
  LogIn,
  Menu,
  Settings,
  Shield,
  Users,
} from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import Badge from '@/components/ui/badge/Badge.vue'
import { useAuth } from '@/stores/auth'
import { useSystem } from '@/stores/system'
import { generatedModules, systemModules } from '@/modules/registry'
import { publishedModules } from '@/lib/published'
import { getRepository, mockMode } from '@/lib/repository'
import { workbenchModules, workbenchShortcuts } from '@/lib/workbench'
import type { DataRow } from '@/types/module'

const auth = useAuth(),
  system = useSystem(),
  router = useRouter()

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
const shortcutHints: Record<string, string> = {
  '/system/users': '账号、部门与角色',
  '/system/roles': '角色标识与权限配置',
  '/system/menus': '导航菜单与访问权限',
  '/system/departments': '部门与上级关系',
  '/system/dictionaries': '维护通用业务选项',
  '/system/operation-logs': '查看操作审计记录',
  '/system/login-logs': '查看登录记录',
  '/tools/generator': '用 AI 生成并发布业务页面',
  '/tools/components': '浏览可复用组件',
  '/settings': '主题与个人偏好',
}
// Only shortcuts with a provided illustration show an image; the rest keep their icon.
const shortcutImages: Record<string, string> = {
  '/system/users': '/illustrations/shortcuts/users.png',
}
const modules = computed(() =>
  workbenchModules(generatedModules, publishedModules.value, auth.can),
)
const shortcuts = computed(() =>
  workbenchShortcuts(
    system.navigation,
    auth.can,
    modules.value.map((m) => m.route),
  ).map((item) => ({
    ...item,
    icon: icons[item.icon ?? ''] ?? Box,
    image: shortcutImages[item.path],
    hint: shortcutHints[item.path] ?? item.group,
  })),
)
const canCreate = computed(() => auth.can('generator:create'))

const logModule = systemModules.find((m) => m.key === 'operation-logs')!
const canReadLogs = computed(() => auth.can('operation-logs:read'))
const logs = ref<DataRow[]>([])
const logsState = ref<'loading' | 'ready' | 'error'>('loading')
const logsError = ref('')
onMounted(async () => {
  if (!canReadLogs.value) return
  try {
    const { items } = await getRepository(logModule).list({ page: 1, pageSize: 5 })
    logs.value = items
    logsState.value = 'ready'
  } catch (e) {
    logsError.value = e instanceof Error ? e.message : '加载失败'
    logsState.value = 'error'
  }
})
</script>
<template>
  <div class="space-y-6">
    <section
      class="flex items-center justify-between gap-6 overflow-hidden rounded-xl border bg-card px-6 py-5 sm:px-8"
    >
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight">工作台</h1>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          欢迎回来，{{ auth.session?.username }}。从这里开始构建你的业务。
        </p>
        <Button v-if="canCreate" class="mt-5" @click="router.push('/tools/generator')"
          ><Code2 />创建业务页面</Button
        >
      </div>
      <img
        src="/illustrations/workspace-welcome.png"
        alt=""
        width="1536"
        height="1024"
        class="hidden h-[220px] w-auto shrink-0 object-contain md:block"
      />
    </section>

    <section aria-labelledby="shortcuts-title">
      <h2 id="shortcuts-title" class="mb-3 font-semibold">快捷入口</h2>
      <div v-if="shortcuts.length" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <RouterLink
          v-for="item in shortcuts"
          :key="item.path"
          :to="item.path"
          class="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs transition-colors outline-none hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40"
            ><img
              v-if="item.image"
              :src="item.image"
              alt=""
              width="1254"
              height="1254"
              loading="lazy"
              class="size-8 object-contain"
            /><component :is="item.icon" v-else class="size-5" aria-hidden="true"
          /></span>
          <span class="min-w-0 flex-1">
            <span class="block font-medium">{{ item.title }}</span>
            <span class="mt-0.5 block truncate text-sm text-muted-foreground">{{ item.hint }}</span>
          </span>
          <ArrowUpRight
            class="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
            aria-hidden="true"
          />
        </RouterLink>
      </div>
      <p v-else class="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        当前账号没有可访问的功能入口。
      </p>
    </section>

    <div class="grid gap-4 lg:grid-cols-7">
      <section
        aria-labelledby="modules-title"
        class="rounded-xl border bg-card p-6 shadow-xs lg:col-span-4"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="modules-title" class="font-semibold">业务模块</h2>
            <p class="mt-1 text-sm text-muted-foreground">已生成或已发布、且你有权访问的模块。</p>
          </div>
          <Button
            v-if="canCreate && modules.length"
            variant="outline"
            size="sm"
            @click="router.push('/tools/generator')"
            >新建模块</Button
          >
        </div>
        <ul v-if="modules.length" class="mt-4 divide-y">
          <li v-for="item in modules" :key="item.key">
            <RouterLink
              :to="item.route"
              class="flex items-center gap-4 rounded-md px-2 py-3 outline-none hover:bg-muted/30 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Box class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="truncate text-sm font-medium">{{ item.title }}</span>
                  <Badge :variant="item.source === 'published' ? 'secondary' : 'outline'">{{
                    item.source === 'published' ? '已发布' : '源码生成'
                  }}</Badge>
                </span>
                <span class="mt-0.5 block truncate text-xs text-muted-foreground"
                  >{{ item.route }} · {{ item.fieldCount }} 个字段</span
                >
              </span>
              <ArrowRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </RouterLink>
          </li>
        </ul>
        <div v-else class="mt-4 rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
          <p>还没有可访问的业务模块。</p>
          <Button
            v-if="canCreate"
            variant="outline"
            size="sm"
            class="mt-3"
            @click="router.push('/tools/generator')"
            >打开页面生成器<ArrowRight
          /></Button>
        </div>
      </section>

      <section
        aria-labelledby="logs-title"
        class="rounded-xl border bg-card p-6 shadow-xs lg:col-span-3"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 id="logs-title" class="font-semibold">最近操作</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ mockMode ? 'Mock 模式下为模拟审计数据。' : '来自操作日志接口。' }}
            </p>
          </div>
          <RouterLink
            v-if="canReadLogs"
            to="/system/operation-logs"
            class="shrink-0 rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >查看全部</RouterLink
          >
        </div>
        <p v-if="!canReadLogs" class="mt-4 text-sm text-muted-foreground">
          当前账号没有查看操作日志的权限。
        </p>
        <p
          v-else-if="logsState === 'loading'"
          class="mt-4 text-sm text-muted-foreground"
          role="status"
        >
          正在加载…
        </p>
        <p v-else-if="logsState === 'error'" class="mt-4 text-sm text-destructive" role="alert">
          操作日志加载失败：{{ logsError }}
        </p>
        <p v-else-if="!logs.length" class="mt-4 text-sm text-muted-foreground">暂无操作记录。</p>
        <ul v-else class="mt-4 divide-y text-sm">
          <li v-for="log in logs" :key="log.id" class="flex items-center justify-between gap-4 py-3">
            <span class="min-w-0">
              <span class="block truncate font-medium">{{ log.action }}</span>
              <span class="block truncate text-xs text-muted-foreground"
                >{{ log.operator }} · {{ log.ip }}</span
              >
            </span>
            <span class="shrink-0 text-right text-xs">
              <span
                class="block"
                :class="log.result === '失败' ? 'text-destructive' : 'text-muted-foreground'"
                >{{ log.result }}</span
              >
              <time class="block text-muted-foreground">{{ log.time }}</time>
            </span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
