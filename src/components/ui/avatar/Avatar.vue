<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  src?: string
  alt?: string
  fallback?: string
}>()
</script>

<template>
  <AvatarRoot
    :class="cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', props.class)"
  >
    <AvatarImage v-if="src" :src="src" :alt="alt" class="aspect-square size-full object-cover" />
    <AvatarFallback
      class="flex size-full items-center justify-center rounded-full bg-muted text-sm"
    >
      {{ fallback ?? '?' }}
    </AvatarFallback>
  </AvatarRoot>
</template>
