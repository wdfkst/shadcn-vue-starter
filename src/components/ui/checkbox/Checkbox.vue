<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  modelValue?: boolean | 'indeterminate'
  disabled?: boolean
}>()

defineEmits<{ (e: 'update:modelValue', value: boolean | 'indeterminate'): void }>()
</script>

<template>
  <CheckboxRoot
    :class="
      cn(
        'peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-shadow',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
        props.class,
      )
    "
    :checked="modelValue === true ? true : modelValue === 'indeterminate' ? 'indeterminate' : false"
    :disabled="disabled"
    @update:checked="$emit('update:modelValue', $event)"
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Check v-if="modelValue === true" class="size-3.5" />
      <span v-else-if="modelValue === 'indeterminate'" class="block size-2 bg-current rounded-sm" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
