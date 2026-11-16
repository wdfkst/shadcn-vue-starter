<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, ref } from 'vue'
import { CalendarDate, parseDate, today, getLocalTimeZone, toCalendarDate } from '@internationalized/date'
import { CalendarRoot } from 'reka-ui'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import Popover from '@/components/ui/popover/Popover.vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  modelValue?: string
  id?: string
  class?: HTMLAttributes['class']
  invalid?: boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const open = ref(false)
const placeholder = ref<CalendarDate>()

const value = computed(() => {
  try {
    return props.modelValue ? parseDate(props.modelValue) : undefined
  } catch {
    return undefined
  }
})
const label = computed(() =>
  value.value ? `${value.value.year}年${value.value.month}月${value.value.day}日` : '年/月/日',
)

function onSelect(date: CalendarDate) {
  emit('update:modelValue', date.toString())
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open" align="start" class="w-64 p-2">
    <template #trigger>
      <button
        :id="id"
        type="button"
        :aria-invalid="invalid || undefined"
        :class="
          cn(
            'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
            'aria-invalid:border-destructive',
            props.class,
          )
        "
      >
        <span :class="value ? '' : 'text-muted-foreground'">{{ label }}</span>
        <CalendarIcon class="ml-auto size-4 text-muted-foreground" />
      </button>
    </template>
    <CalendarRoot
      v-slot="{ grid, weekDays }"
      :model-value="value"
      :placeholder="placeholder ?? value ?? today(getLocalTimeZone())"
      locale="zh-CN"
      class="text-sm"
      @update:placeholder="placeholder = toCalendarDate($event)"
    >
      <template v-for="month in grid" :key="month.value.toString()">
        <div class="flex items-center justify-between px-1 py-1">
          <button
            type="button"
            aria-label="上个月"
            class="rounded-md p-1 hover:bg-accent"
            @click="placeholder = (placeholder ?? toCalendarDate(month.value)).subtract({ months: 1 })"
          >
            <ChevronLeft class="size-4" />
          </button>
          <span class="font-medium">{{ month.value.year }}年{{ month.value.month }}月</span>
          <button
            type="button"
            aria-label="下个月"
            class="rounded-md p-1 hover:bg-accent"
            @click="placeholder = (placeholder ?? toCalendarDate(month.value)).add({ months: 1 })"
          >
            <ChevronRight class="size-4" />
          </button>
        </div>
        <div class="grid grid-cols-7 text-center">
          <div v-for="day in weekDays" :key="day" class="py-1 text-xs text-muted-foreground">
            {{ day }}
          </div>
          <template v-for="(row, i) in month.rows" :key="i">
            <button
              v-for="cell in row"
              :key="cell.toString()"
              type="button"
              :disabled="cell.month !== month.value.month"
              class="rounded-md py-1.5 hover:bg-accent disabled:pointer-events-none disabled:opacity-0"
              :class="
                value && cell.compare(value) === 0
                  ? 'bg-primary text-primary-foreground hover:bg-primary'
                  : ''
              "
              @click="onSelect(toCalendarDate(cell))"
            >
              {{ cell.day }}
            </button>
          </template>
        </div>
      </template>
    </CalendarRoot>
  </Popover>
</template>
