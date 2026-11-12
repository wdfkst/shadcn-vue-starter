<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  Plus,
  Download,
  SlidersHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import Select from '@/components/ui/select/Select.vue'
import SelectItem from '@/components/ui/select/SelectItem.vue'
import { getRepository } from '@/lib/repository'
import { useAuth } from '@/stores/auth'
import type { ModuleDefinition, DataRow, Repository } from '@/types/module'
const props = defineProps<{
  module: ModuleDefinition
  repository?: Repository
  preview?: boolean
}>()
const auth = useAuth(),
  rows = ref<DataRow[]>([]),
  total = ref(0),
  query = ref(''),
  filters = reactive<Record<string, string>>({}),
  page = ref(1),
  pageSize = ref(10),
  loading = ref(false),
  error = ref(''),
  success = ref(''),
  editor = ref(false),
  columnsOpen = ref(false),
  deleting = ref<DataRow | null>(null),
  selected = ref<string[]>([]),
  mode = ref<'create' | 'edit' | 'detail'>('create'),
  editingId = ref(''),
  form = reactive<Record<string, unknown>>({}),
  saving = ref(false),
  hidden = ref<string[]>([])
const repo = computed(() => props.repository ?? getRepository(props.module))
const fields = computed(() =>
  props.module.fields.filter((f) => f.list !== false && !hidden.value.includes(f.key)),
)
const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const writable = computed(() => !props.preview && !props.module.readOnly)
const can = (action: string) => writable.value && auth.can(`${props.module.key}:${action}`)
let request = 0
async function load() {
  const id = ++request
  loading.value = true
  error.value = ''
  try {
    const result = await repo.value.list({
      query: query.value,
      filters: { ...filters },
      page: page.value,
      pageSize: pageSize.value,
    })
    if (id !== request) return
    rows.value = result.items
    total.value = result.total
    selected.value = []
    if (page.value > pages.value) {
      page.value = pages.value
      return load()
    }
  } catch (e) {
    if (id === request) error.value = (e as Error).message
  } finally {
    if (id === request) loading.value = false
  }
}
function search() {
  page.value = 1
  void load()
}
function reset() {
  query.value = ''
  Object.keys(filters).forEach((k) => delete filters[k])
  search()
}
watch(
  () => props.module,
  () => {
    hidden.value = []
    reset()
  },
  { immediate: true },
)
watch([page, pageSize], () => void load())
function open(kind: 'create' | 'edit' | 'detail', row?: DataRow) {
  mode.value = kind
  editingId.value = row?.id ?? ''
  Object.keys(form).forEach((k) => delete form[k])
  props.module.fields.forEach(
    (f) => (form[f.key] = row?.[f.key] ?? (f.type === 'boolean' ? false : '')),
  )
  error.value = ''
  editor.value = true
}
async function save() {
  saving.value = true
  error.value = ''
  try {
    if (mode.value === 'create') await repo.value.create(form, auth.role!)
    else await repo.value.update(editingId.value, form, auth.role!)
    editor.value = false
    success.value = '保存成功'
    await load()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    saving.value = false
  }
}
async function remove() {
  if (!deleting.value) return
  saving.value = true
  try {
    await repo.value.remove(deleting.value.id, auth.role!)
    deleting.value = null
    success.value = '删除成功'
    await load()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    saving.value = false
  }
}
function csv() {
  const cell = (v: unknown) =>
    '"' +
    String(v ?? '')
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"'
  const data = [
    fields.value.map((f) => cell(f.label)).join(','),
    ...rows.value
      .filter((r) => !selected.value.length || selected.value.includes(r.id))
      .map((r) => fields.value.map((f) => cell(r[f.key])).join(',')),
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + data], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = props.module.key + '.csv'
  a.click()
  URL.revokeObjectURL(url)
}
function display(value: unknown) {
  return typeof value === 'boolean'
    ? value
      ? '是'
      : '否'
    : value === '' || value == null
      ? '—'
      : value
}
</script>
<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">{{ module.title }}</h1>
        <p class="mt-1 text-sm text-muted-foreground">{{ module.description }}</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="csv"><Download />导出当前页</Button
        ><Button v-if="can('create')" @click="open('create')"><Plus />新增</Button>
      </div>
    </div>
    <div
      v-if="error && !editor"
      role="alert"
      class="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>
    <p v-if="success" role="status" class="text-sm text-muted-foreground">{{ success }}</p>
    <form class="flex flex-wrap items-center gap-2" @submit.prevent="search">
      <div class="relative">
        <Search class="absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input
          v-model="query"
          class="h-9 w-60 pl-9"
          placeholder="搜索关键词…"
          aria-label="搜索关键词"
        />
      </div>
      <div
        v-for="field in module.fields.filter((f) => f.search && f.type === 'select')"
        :key="field.key"
        class="w-32"
      >
        <Select
          :model-value="filters[field.key] || '__all'"
          @update:model-value="filters[field.key] = $event === '__all' ? '' : $event"
          ><SelectItem value="__all">全部{{ field.label }}</SelectItem
          ><SelectItem v-for="option in field.options" :key="option" :value="option">{{
            option
          }}</SelectItem></Select
        >
      </div>
      <Button type="submit" variant="outline">查询</Button
      ><Button type="button" variant="ghost" @click="reset">重置</Button
      ><span class="flex-1" /><Button
        type="button"
        size="icon"
        variant="outline"
        aria-label="刷新"
        @click="load"
        ><RefreshCw class="size-4" /></Button
      ><Button type="button" variant="outline" @click="columnsOpen = true"
        ><SlidersHorizontal />列设置</Button
      >
    </form>
    <div class="overflow-hidden rounded-md border">
      <div class="overflow-x-auto">
      <table class="w-full whitespace-nowrap text-left text-sm">
        <thead class="border-b text-muted-foreground">
          <tr>
            <th class="w-10 p-3">
              <input
                aria-label="选择当前页"
                type="checkbox"
                :checked="rows.length > 0 && selected.length === rows.length"
                @change="
                  selected = ($event.target as HTMLInputElement).checked
                    ? rows.map((r) => r.id)
                    : []
                "
              />
            </th>
            <th v-for="field in fields" :key="field.key" class="h-11 px-4 font-medium">
              {{ field.label }}
            </th>
            <th class="px-4 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="fields.length + 2" class="h-32 text-center text-muted-foreground">
              加载中…
            </td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="fields.length + 2" class="h-40 text-center text-muted-foreground">
              没有符合条件的数据
            </td>
          </tr>
          <template v-else
            ><tr
              v-for="row in rows"
              :key="row.id"
              class="border-b transition-colors last:border-0 hover:bg-muted/50"
            >
              <td class="p-3">
                <input
                  v-model="selected"
                  type="checkbox"
                  :value="row.id"
                  :aria-label="`选择记录 ${row.id}`"
                />
              </td>
              <td
                v-for="field in fields"
                :key="field.key"
                class="max-w-64 truncate px-4 py-4"
                :title="String(display(row[field.key]))"
              >
                <span
                  v-if="field.type === 'select' || field.type === 'boolean'"
                  class="rounded-md border bg-muted/40 px-2 py-0.5 text-xs"
                  >{{ display(row[field.key]) }}</span
                ><span v-else :class="field.key === 'username' ? 'font-medium' : ''">{{
                  display(row[field.key])
                }}</span>
              </td>
              <td class="px-2">
                <div class="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="查看详情"
                    @click="open('detail', row)"
                    ><Eye class="size-4" /></Button
                  ><Button
                    v-if="can('update')"
                    size="icon"
                    variant="ghost"
                    aria-label="编辑"
                    @click="open('edit', row)"
                    ><Pencil class="size-4" /></Button
                  ><Button
                    v-if="can('delete')"
                    size="icon"
                    variant="ghost"
                    aria-label="删除"
                    @click="deleting = row"
                    ><Trash2 class="size-4 text-destructive"
                  /></Button>
                </div>
              </td></tr
          ></template>
        </tbody>
      </table>
      </div>
      <div class="flex flex-wrap items-center gap-3 border-t p-4 text-sm">
        <span class="text-muted-foreground">已选择 {{ selected.length }} 条</span
        ><span class="flex-1" /><span class="text-muted-foreground">每页</span
        ><select
          v-model.number="pageSize"
          aria-label="每页条数"
          class="h-8 rounded-md border bg-background px-2"
        >
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option></select
        ><span class="text-muted-foreground">第 {{ page }} / {{ pages }} 页</span
        ><Button
          size="icon"
          variant="outline"
          :disabled="page <= 1"
          aria-label="上一页"
          @click="page--"
          ><ChevronLeft /></Button
        ><Button
          v-for="n in pages"
          :key="n"
          size="icon"
          :variant="n === page ? 'default' : 'outline'"
          :aria-label="`第 ${n} 页`"
          :aria-current="n === page ? 'page' : undefined"
          @click="page = n"
          >{{ n }}</Button
        ><Button
          size="icon"
          variant="outline"
          :disabled="page >= pages"
          aria-label="下一页"
          @click="page++"
          ><ChevronRight
        /></Button>
      </div>
    </div>
    <Dialog
      v-model:open="editor"
      :title="
        (mode === 'create' ? '新增' : mode === 'edit' ? '编辑' : '详情') + ' · ' + module.title
      "
      description="填写业务字段，带 * 的字段为必填。"
      class="max-h-[90svh] max-w-xl overflow-y-auto"
      ><form class="space-y-4" @submit.prevent="save">
        <div v-for="field in module.fields" :key="field.key" class="space-y-2">
          <label :for="field.key" class="text-sm font-medium"
            >{{ field.label
            }}<span v-if="field.required" class="ml-1 text-destructive">*</span></label
          >
          <div v-if="mode === 'detail'" class="rounded-md bg-muted/50 p-2 text-sm">
            {{ display(form[field.key]) }}
          </div>
          <Select
            v-else-if="field.type === 'select'"
            :model-value="String(form[field.key] || '')"
            @update:model-value="form[field.key] = $event"
            ><SelectItem v-for="option in field.options" :key="option" :value="option">{{
              option
            }}</SelectItem></Select
          ><input
            v-else-if="field.type === 'boolean'"
            :id="field.key"
            v-model="form[field.key]"
            type="checkbox"
            class="ml-3"
          /><textarea
            v-else-if="field.type === 'textarea'"
            :id="field.key"
            v-model="form[field.key] as string"
            class="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
            :required="field.required"
          /><Input
            v-else
            :id="field.key"
            v-model="form[field.key] as string"
            :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
            :step="field.type === 'number' ? 'any' : undefined"
            :required="field.required"
          />
        </div>
        <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
        <div class="flex justify-end gap-2 pt-3">
          <Button type="button" variant="outline" @click="editor = false">{{
            mode === 'detail' ? '关闭' : '取消'
          }}</Button
          ><Button v-if="mode !== 'detail'" type="submit" :disabled="saving">{{
            saving ? '保存中…' : '保存'
          }}</Button>
        </div>
      </form></Dialog
    >
    <Dialog
      :open="!!deleting"
      title="确认删除"
      description="删除后无法恢复，请确认该记录不再需要。"
      @update:open="
        (value) => {
          if (!value) deleting = null
        }
      "
      ><div class="flex justify-end gap-2">
        <Button variant="outline" @click="deleting = null">取消</Button
        ><Button variant="destructive" :disabled="saving" @click="remove">确认删除</Button>
      </div></Dialog
    >
    <Dialog v-model:open="columnsOpen" title="显示列" description="选择需要在表格中展示的字段。"
      ><label
        v-for="field in module.fields.filter((f) => f.list !== false)"
        :key="field.key"
        class="flex items-center gap-3 text-sm"
        ><input
          type="checkbox"
          :checked="!hidden.includes(field.key)"
          @change="
            hidden = hidden.includes(field.key)
              ? hidden.filter((k) => k !== field.key)
              : [...hidden, field.key]
          "
        />{{ field.label }}</label
      ></Dialog
    >
  </div>
</template>
