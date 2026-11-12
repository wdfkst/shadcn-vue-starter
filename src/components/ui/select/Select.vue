<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import {
  SelectContent,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  type SelectContentProps,
} from 'reka-ui'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    triggerClass?: HTMLAttributes['class']
    placeholder?: string
    modelValue?: string
    disabled?: boolean
    side?: SelectContentProps['side']
    align?: SelectContentProps['align']
  }>(),
  { placeholder: '请选择', side: 'bottom', align: 'start' },
)

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<template>
  <SelectRoot
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <SelectTrigger
      :class="
        cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
          'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring',
          'disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate [&>span]:text-start',
          triggerClass,
        )
      "
    >
      <SelectValue :placeholder="placeholder" />
      <ChevronDown class="size-4 shrink-0 text-muted-foreground opacity-50" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        :side="side"
        :align="align"
        position="popper"
        :side-offset="4"
        :class="
          cn(
            'relative z-50 max-h-(--reka-select-content-available-height) w-full min-w-(--reka-select-trigger-width) overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            props.class,
          )
        "
      >
        <SelectViewport class="p-1"><slot /></SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
