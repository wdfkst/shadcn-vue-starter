<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    open?: boolean
    title?: string
    description?: string
    hideClose?: boolean
  }>(),
  { open: false, hideClose: false },
)

const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
      />
      <DialogContent
        :class="
          cn(
            'fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg rounded-lg',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            props.class,
          )
        "
      >
        <DialogTitle v-if="title || $slots.title" class="text-lg font-semibold">
          <slot name="title">{{ title }}</slot>
        </DialogTitle>
        <DialogDescription
          v-if="description || $slots.description"
          class="text-sm text-muted-foreground"
        >
          <slot name="description">{{ description }}</slot>
        </DialogDescription>
        <slot />
        <button
          v-if="!hideClose"
          type="button"
          class="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          @click="emit('update:open', false)"
        >
          <X class="size-4" />
          <span class="sr-only">关闭</span>
        </button>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
