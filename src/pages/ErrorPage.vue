<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
defineProps<{ code: string; message: string }>()
</script>
<template>
  <div class="flex min-h-[65vh] flex-col items-center justify-center gap-5">
    <h1 class="text-8xl font-bold tracking-tighter">{{ code }}</h1>
    <p class="text-muted-foreground">{{ message }}</p>
    <Button as-child><RouterLink to="/">返回首页</RouterLink></Button>
  </div>
</template>
