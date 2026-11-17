<script setup lang="ts">
import { computed } from 'vue'
import Button from '@/components/ui/button/Button.vue'
const props = defineProps<{ code: string; message: string }>()
// The access-denied file ships with a space before the extension; encode it in the URL.
const images: Record<string, string> = {
  '403': '/illustrations/access-denied%20.png',
  '404': '/illustrations/page-not-found.png',
}
const image = computed(() => images[props.code])
</script>
<template>
  <div class="flex min-h-[65vh] flex-col items-center justify-center gap-5 px-4 text-center">
    <img
      v-if="image"
      :src="image"
      alt=""
      width="1312"
      height="1199"
      class="h-40 w-auto rounded-xl object-contain mix-blend-multiply sm:h-48 dark:mix-blend-normal"
    />
    <h1 class="font-bold tracking-tighter" :class="image ? 'text-6xl' : 'text-8xl'">{{ code }}</h1>
    <p class="text-muted-foreground">{{ message }}</p>
    <Button as-child><RouterLink to="/">返回首页</RouterLink></Button>
  </div>
</template>
