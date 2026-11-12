<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{ class?: HTMLAttributes['class']; sideOffset?: number }>(),
  { sideOffset: 4 },
)
</script>

<template>
  <TooltipProvider>
    <TooltipRoot>
      <TooltipTrigger v-bind="$attrs">
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipContent
        :side-offset="sideOffset"
        :class="
          cn(
            'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            props.class,
          )
        "
      >
        <slot />
      </TooltipContent>
    </TooltipRoot>
  </TooltipProvider>
</template>
