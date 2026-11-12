<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus, Trash2, Download, Code2, Eye, Settings2, Upload } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import CrudPage from '@/components/crud/CrudPage.vue'
import { generateFiles, validateConfig, type GeneratorConfig } from '@/generator/core.mjs'
import { createMemoryRepository } from '@/lib/repository'
import type { ModuleDefinition } from '@/types/module'
const config = reactive<GeneratorConfig>({
  key: 'products',
  title: '商品管理',
  description: '管理商品信息与上架状态。',
  route: '/business/products',
  fields: [
    { key: 'name', label: '商品名称', type: 'text', required: true, list: true, search: true },
    {
      key: 'category',
      label: '商品分类',
      type: 'select',
      options: ['办公用品', '电子产品', '其他'],
      required: true,
      list: true,
      search: true,
    },
    { key: 'price', label: '商品价格', type: 'number', required: true, list: true, search: false },
    {
      key: 'enabled',
      label: '是否上架',
      type: 'boolean',
      required: false,
      list: true,
      search: false,
    },
  ],
})
const tab = ref('fields'),
  error = ref(''),
  fileInput = ref<HTMLInputElement | null>(null),
  selectedFile = ref('')
const validation = computed(() => {
  try {
    return { data: validateConfig(config), error: '' }
  } catch (e) {
    const details = (e as any).issues
    return {
      data: null,
      error: details
        ? details.map((x: any) => x.path.join('.') + '：' + x.message).join('；')
        : (e as Error).message,
    }
  }
})
const files = computed(() => (validation.value.data ? generateFiles(validation.value.data) : {}))
const preview = computed(() => {
  if (!validation.value.data) return null
  const module: ModuleDefinition = {
    ...validation.value.data,
    description: '生成页面实时预览 · 无法在预览中修改数据',
  }
  const row: Record<string, any> = { id: 'preview' }
  for (const f of module.fields)
    row[f.key] =
      f.type === 'number'
        ? 128
        : f.type === 'boolean'
          ? true
          : f.type === 'select'
            ? f.options?.[0]
            : f.type === 'date'
              ? '2026-11-11'
              : f.label + '示例'
  return { module, repo: createMemoryRepository(module, [row as any]) }
})
const activeFile = computed(() =>
  selectedFile.value in files.value ? selectedFile.value : Object.keys(files.value)[0] || '',
)
function add() {
  config.fields.push({
    key: 'field' + (config.fields.length + 1),
    label: '新字段',
    type: 'text',
    list: true,
    search: false,
    required: false,
  })
}
function download() {
  if (!validation.value.data) {
    error.value = validation.value.error
    return
  }
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(validation.value.data, null, 2)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = config.key + '.json'
  a.click()
  URL.revokeObjectURL(url)
}
async function importConfig(e: Event) {
  try {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    if (file.size > 100000) throw Error('配置文件不能超过 100KB')
    const parsed = validateConfig(JSON.parse(await file.text()))
    Object.assign(config, parsed)
    error.value = ''
  } catch (e) {
    error.value = '导入失败：' + (e as Error).message
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>
<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">页面生成器</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          配置业务字段，生成可维护的 Vue 页面、接口和模拟数据。
        </p>
      </div>
      <div class="flex gap-2">
        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          class="hidden"
          @change="importConfig"
        /><Button variant="outline" @click="fileInput?.click()"><Upload />导入配置</Button
        ><Button :disabled="!validation.data" @click="download"><Download />导出配置</Button>
      </div>
    </div>
    <p
      v-if="error"
      role="alert"
      class="rounded-md border border-destructive/30 p-3 text-sm text-destructive"
    >
      {{ error }}
    </p>
    <div class="grid items-start gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside class="space-y-5 rounded-xl border p-5">
        <h2 class="text-sm font-semibold">模块配置</h2>
        <div class="space-y-2">
          <label for="module-title" class="text-xs font-medium">模块名称</label
          ><Input id="module-title" v-model="config.title" />
        </div>
        <div class="space-y-2">
          <label for="module-key" class="text-xs font-medium">模块标识</label
          ><Input id="module-key" v-model="config.key" />
          <p class="text-xs leading-5 text-muted-foreground">
            小写字母开头的英文标识，不得与内置模块重复。
          </p>
        </div>
        <div class="space-y-2">
          <label for="module-route" class="text-xs font-medium">路由地址</label
          ><Input id="module-route" v-model="config.route" />
        </div>
        <div class="space-y-2">
          <label for="module-description" class="text-xs font-medium">页面描述</label
          ><textarea
            id="module-description"
            v-model="config.description"
            class="min-h-20 w-full rounded-md border bg-background p-2 text-sm"
          />
        </div>
        <div class="border-t pt-4 text-xs leading-6 text-muted-foreground">
          自动包含查询、分页、新增、编辑、详情、删除和权限控制。<br />生成后可修改源码，不锁定在运行时低代码平台中。
        </div>
      </aside>
      <div class="min-w-0 space-y-5">
        <div class="flex gap-5 border-b">
          <button
            v-for="item in [
              { id: 'fields', label: '字段配置', icon: Settings2 },
              { id: 'preview', label: '页面预览', icon: Eye },
              { id: 'code', label: '生成产物', icon: Code2 },
            ]"
            :key="item.id"
            class="flex items-center gap-2 border-b-2 px-1 pb-3 text-sm"
            :class="
              tab === item.id
                ? 'border-primary font-medium'
                : 'border-transparent text-muted-foreground'
            "
            @click="tab = item.id"
          >
            <component :is="item.icon" class="size-4" />{{ item.label }}
          </button>
        </div>
        <p
          v-if="validation.error"
          role="alert"
          class="rounded-md border border-destructive/30 p-3 text-xs leading-6 text-destructive"
        >
          {{ validation.error }}
        </p>
        <div v-if="tab === 'fields'" class="space-y-4">
          <div class="overflow-x-auto rounded-md border">
            <table class="w-full min-w-[720px] text-left text-sm">
              <thead class="border-b bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th class="p-3 font-medium">字段名称 / 标识</th>
                  <th class="p-3 font-medium">控件 / 选项</th>
                  <th class="p-3 font-medium">列表</th>
                  <th class="p-3 font-medium">查询</th>
                  <th class="p-3 font-medium">必填</th>
                  <th class="p-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(field, i) in config.fields" :key="i" class="border-b last:border-0">
                  <td class="w-48 space-y-2 p-3">
                    <Input v-model="field.label" :aria-label="`字段 ${i + 1} 名称`" /><Input
                      v-model="field.key"
                      class="font-mono text-xs"
                      :aria-label="`字段 ${i + 1} 标识`"
                    />
                  </td>
                  <td class="w-48 p-3">
                    <select
                      v-model="field.type"
                      class="h-9 w-full rounded-md border bg-background px-2"
                      :aria-label="`字段 ${i + 1} 类型`"
                      @change="
                        () => {
                          if (field.type === 'select' && !field.options)
                            field.options = ['选项一', '选项二']
                        }
                      "
                    >
                      <option value="text">文本输入</option>
                      <option value="textarea">多行文本</option>
                      <option value="number">数字输入</option>
                      <option value="select">下拉选择</option>
                      <option value="boolean">布尔开关</option>
                      <option value="date">日期</option></select
                    ><Input
                      v-if="field.type === 'select'"
                      class="mt-2 text-xs"
                      :model-value="field.options?.join(',')"
                      placeholder="选项用英文逗号分隔"
                      @update:model-value="
                        field.options = String($event)
                          .split(',')
                          .map((s) => s.trim())
                      "
                    />
                  </td>
                  <td class="p-3">
                    <input
                      v-model="field.list"
                      type="checkbox"
                      :aria-label="`${field.label}显示在列表`"
                    />
                  </td>
                  <td class="p-3">
                    <input
                      v-model="field.search"
                      type="checkbox"
                      :aria-label="`${field.label}可查询`"
                    />
                  </td>
                  <td class="p-3">
                    <input
                      v-model="field.required"
                      type="checkbox"
                      :aria-label="`${field.label}必填`"
                    />
                  </td>
                  <td class="p-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      :disabled="config.fields.length === 1"
                      aria-label="移除字段"
                      @click="config.fields.splice(i, 1)"
                      ><Trash2 class="size-4"
                    /></Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button variant="outline" :disabled="config.fields.length >= 40" @click="add"
            ><Plus />添加字段</Button
          >
        </div>
        <div v-else-if="tab === 'preview' && preview" class="rounded-xl border p-4">
          <CrudPage
            :key="JSON.stringify(config)"
            :module="preview.module"
            :repository="preview.repo"
            preview
          />
        </div>
        <div v-else-if="tab === 'code'" class="space-y-4">
          <div class="rounded-xl border p-5">
            <h2 class="text-sm font-semibold">在本地生成源码</h2>
            <ol class="my-3 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              <li>导出配置文件，保存到项目之外或 examples 目录。</li>
              <li>在项目根目录执行以下命令。</li>
              <li>运行构建检查，新模块自动出现在侧栏。</li>
            </ol>
            <pre class="overflow-x-auto rounded-md bg-muted/50 p-3 text-xs">
npm run gen -- --config /path/to/{{ config.key }}.json</pre
            >
            <p class="mt-3 text-xs text-muted-foreground">
              遇到已存在文件会停止，不覆盖手写代码。此页面不会直接写入项目文件。
            </p>
          </div>
          <div v-if="activeFile" class="overflow-hidden rounded-xl border">
            <select
              v-model="selectedFile"
              class="w-full border-b bg-muted/30 p-3 font-mono text-xs"
              aria-label="预览文件"
            >
              <option value="" disabled>选择生成文件</option>
              <option v-for="path in Object.keys(files)" :key="path" :value="path">
                {{ path }}
              </option>
            </select>
            <p class="border-b px-4 py-2 text-xs text-muted-foreground">{{ activeFile }}</p>
            <pre
              class="max-h-96 overflow-auto p-4 text-xs leading-6"
            ><code>{{files[activeFile]}}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
