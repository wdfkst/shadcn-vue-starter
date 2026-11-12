<script setup lang="ts">
import { ArrowUpRight, Users, Shield, Code2, BookOpen, ArrowRight } from 'lucide-vue-next'
import { useAuth } from '@/stores/auth'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/button/Button.vue'
const auth = useAuth(),
  router = useRouter()
const shortcuts = [
  { name: '用户管理', description: '账号、部门与角色', icon: Users, path: '/system/users' },
  { name: '角色管理', description: '角色标识与权限配置', icon: Shield, path: '/system/roles' },
  {
    name: '字典管理',
    description: '维护通用业务选项',
    icon: BookOpen,
    path: '/system/dictionaries',
  },
]
</script>
<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">工作台</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          欢迎回来，{{ auth.session?.username }}。从这里开始构建你的业务。
        </p>
      </div>
      <Button v-if="auth.can('generator:create')" @click="router.push('/tools/generator')"
        ><Code2 />创建业务页面</Button
      >
    </div>
    <div class="inline-flex gap-5 border-b text-sm">
      <span class="border-b-2 border-primary pb-3 font-medium">概览</span
      ><RouterLink to="/settings" class="pb-3 text-muted-foreground">个人设置</RouterLink>
    </div>
    <div class="grid gap-4 md:grid-cols-3">
      <button
        v-for="item in shortcuts"
        :key="item.path"
        class="rounded-xl border bg-card p-6 text-left shadow-xs transition-colors hover:bg-muted/30"
        @click="router.push(item.path)"
      >
        <div class="mb-5 flex items-center justify-between">
          <component :is="item.icon" class="size-5" /><ArrowUpRight
            class="size-4 text-muted-foreground"
          />
        </div>
        <h2 class="font-semibold">{{ item.name }}</h2>
        <p class="mt-2 text-sm text-muted-foreground">{{ item.description }}</p>
      </button>
    </div>
    <div class="grid gap-4 lg:grid-cols-7">
      <section class="rounded-xl border bg-card p-6 shadow-xs lg:col-span-4">
        <h2 class="font-semibold">开始使用</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          一致的组件、清晰的模块边界，让新项目更快落地。
        </p>
        <div class="mt-6 space-y-6">
          <div
            v-for="(item, i) in [
              ['定义业务模块', '在生成器中配置模块名称、字段和查询条件。'],
              ['生成页面源码', '导出配置，用本地命令生成页面、接口和模拟数据。'],
              ['接入你的后端', '关闭 Mock 模式，按照约定连接真实业务接口。'],
            ]"
            :key="i"
            class="flex gap-4"
          >
            <span
              class="flex size-8 shrink-0 items-center justify-center rounded-full border text-sm"
              >{{ i + 1 }}</span
            >
            <div>
              <h3 class="text-sm font-medium">{{ item[0] }}</h3>
              <p class="mt-1 text-sm leading-6 text-muted-foreground">{{ item[1] }}</p>
            </div>
          </div>
        </div>
        <Button
          v-if="auth.can('generator:create')"
          variant="outline"
          class="mt-6"
          @click="router.push('/tools/generator')"
          >打开页面生成器<ArrowRight
        /></Button>
      </section>
      <section class="rounded-xl border bg-card p-6 shadow-xs lg:col-span-3">
        <h2 class="font-semibold">模板说明</h2>
        <p class="mt-1 text-sm text-muted-foreground">第一版 · 前端基础能力</p>
        <div class="mt-6 divide-y text-sm">
          <div
            v-for="item in [
              ['框架', 'Vue 3 / TypeScript'],
              ['构建工具', 'Vite / Tailwind CSS 4'],
              ['组件基础', 'shadcn-vue 风格 / Reka UI'],
              ['路由与状态', 'Vue Router / Pinia'],
              ['业务能力', '通用 CRUD / 页面生成器'],
            ]"
            :key="item[0]"
            class="flex justify-between gap-4 py-4"
          >
            <span class="text-muted-foreground">{{ item[0] }}</span
            ><span class="text-right">{{ item[1] }}</span>
          </div>
        </div>
        <p class="mt-5 rounded-md bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
          当前未接入业务统计接口，因此不展示虚构的营收、增长率等指标。后续可按业务增加仪表盘图表。
        </p>
      </section>
    </div>
  </div>
</template>
