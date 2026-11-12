<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    defaultValue?: string
    modelValue?: string
  }>(),
  { defaultValue: undefined },
)

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<template>
  <TabsRoot
    :default-value="defaultValue"
    :model-value="modelValue"
    :class="cn('flex flex-col gap-2', props.class)"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </TabsRoot>
</template>
