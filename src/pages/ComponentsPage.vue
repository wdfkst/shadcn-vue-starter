<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Copy, Search } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import ButtonExample from '@/components/examples/ButtonExample.vue'
import buttonSource from '@/components/examples/ButtonExample.vue?raw'
import FormExample from '@/components/examples/FormExample.vue'
import formSource from '@/components/examples/FormExample.vue?raw'
import DateExample from '@/components/examples/DateExample.vue'
import dateSource from '@/components/examples/DateExample.vue?raw'
import DialogExample from '@/components/examples/DialogExample.vue'
import dialogSource from '@/components/examples/DialogExample.vue?raw'
import FeedbackExample from '@/components/examples/FeedbackExample.vue'
import feedbackSource from '@/components/examples/FeedbackExample.vue?raw'

const examples = [
  { id: 'buttons', title: '按钮', category: '基础', description: '主次操作、危险操作和禁用状态。', component: ButtonExample, source: buttonSource, keywords: 'button 按钮' },
  { id: 'form', title: '表单与字段校验', category: '表单', description: '提交时校验，输入框下提示；修改后清除旧反馈。', component: FormExample, source: formSource, keywords: 'input validation 输入框 必填 错误' },
  { id: 'date', title: '日期选择', category: '表单', description: '中文日历、全宽触发器，绑定 YYYY-MM-DD 字符串。', component: DateExample, source: dateSource, keywords: 'date calendar 日期 日历' },
  { id: 'dialog', title: '确认弹窗', category: '反馈', description: '受控打开与关闭，支持取消和确认操作。', component: DialogExample, source: dialogSource, keywords: 'dialog modal 弹窗 对话框' },
  { id: 'feedback', title: '状态与消息', category: '反馈', description: '用标签展示状态，用消息区展示操作结果。', component: FeedbackExample, source: feedbackSource, keywords: 'badge alert status 提示 错误 成功' },
]
const categories = ['全部', '基础', '表单', '反馈']
const category = ref('全部')
const search = ref('')
const copied = ref('')
const copyError = ref('')
const visible = computed(() => examples.filter((item) =>
  (category.value === '全部' || item.category === category.value) &&
  `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(search.value.trim().toLowerCase()),
))
async function copy(id: string, source: string) {
  copied.value = ''
  copyError.value = ''
  try {
    await navigator.clipboard.writeText(source)
    copied.value = id
  } catch {
    copyError.value = id
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 py-2">
    <header class="space-y-2">
      <h1 class="text-2xl font-bold tracking-tight">组件示例</h1>
      <p class="max-w-2xl text-sm leading-6 text-muted-foreground">先体验，再复制到页面。示例使用项目现有组件，代码包含导入、状态和模板，可直接保存为 Vue 单文件组件。</p>
    </header>
    <div class="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap gap-1" role="group" aria-label="组件分类">
        <Button v-for="item in categories" :key="item" type="button" :variant="category === item ? 'secondary' : 'ghost'" :aria-pressed="category === item" @click="category = item">{{ item }}</Button>
      </div>
      <div class="relative w-full sm:w-72">
        <Search class="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input v-model="search" aria-label="搜索组件" placeholder="搜索组件或使用场景…" class="pl-9" />
      </div>
    </div>
    <p class="text-xs text-muted-foreground" role="status">{{ visible.length }} 个示例 · 仅本地演示，不修改业务数据</p>
    <div class="grid items-start gap-6 lg:grid-cols-2">
      <section v-for="item in visible" :key="item.id" :aria-labelledby="`heading-${item.id}`" class="min-w-0 overflow-hidden rounded-xl border">
        <div class="space-y-1 px-5 pt-5">
          <h2 :id="`heading-${item.id}`" class="font-semibold">{{ item.title }}</h2>
          <p class="text-sm leading-6 text-muted-foreground">{{ item.description }}</p>
        </div>
        <div class="flex min-h-44 items-center p-5"><component :is="item.component" /></div>
        <div class="border-t bg-muted/20 px-5 py-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-xs text-muted-foreground">完整 Vue 示例</span>
            <Button type="button" variant="outline" size="sm" :aria-label="`复制${item.title}代码`" @click="copy(item.id, item.source)">
              <Check v-if="copied === item.id" class="size-3.5" /><Copy v-else class="size-3.5" />
              <span role="status">{{ copied === item.id ? '已复制' : '复制代码' }}</span>
            </Button>
          </div>
          <p v-if="copyError === item.id" role="alert" class="mb-2 text-sm text-destructive">浏览器未允许复制，请展开代码后手动选择复制。</p>
          <details class="group">
            <summary class="cursor-pointer rounded text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">查看代码</summary>
            <pre tabindex="0" :aria-label="`${item.title}示例代码`" class="mt-3 max-h-96 overflow-auto rounded-md border bg-background p-4 text-xs leading-6"><code>{{ item.source }}</code></pre>
          </details>
        </div>
      </section>
    </div>
    <div v-if="!visible.length" class="rounded-lg border border-dashed px-6 py-14 text-center">
      <p class="font-medium">没有找到匹配的组件</p>
      <p class="mt-2 text-sm text-muted-foreground">尝试搜索“日期”或“弹窗”，也可以清除筛选。</p>
      <Button type="button" variant="outline" class="mt-4" @click="search = ''; category = '全部'">清除筛选</Button>
    </div>
    <p class="text-xs leading-6 text-muted-foreground">复制到已有页面时，请合并 script 和 template，不要重复声明。示例源码位于 src/components/examples，预览与复制使用同一份源码。</p>
  </div>
</template>
