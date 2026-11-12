<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { Separator, type SeparatorProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<SeparatorProps & { class?: HTMLAttributes['class']; label?: string }>(),
  { orientation: 'horizontal', decorative: true },
)

const labelClass = computed(() =>
  props.orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
)
</script>

<template>
  <Separator
    :data-slot="'separator-root'"
    :decorative="decorative"
    :orientation="orientation"
    :class="cn('bg-border shrink-0', labelClass, props.class)"
  >
    <slot />
  </Separator>
</template>
