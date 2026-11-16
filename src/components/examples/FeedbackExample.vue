<script setup lang="ts">
import Badge from '@/components/ui/badge/Badge.vue'
</script>

<template>
  <div class="w-full space-y-5">
    <div class="flex flex-wrap gap-2">
      <Badge>已启用</Badge>
      <Badge variant="secondary">待处理</Badge>
      <Badge variant="outline">草稿</Badge>
      <Badge variant="destructive">失败</Badge>
    </div>
    <div role="status" class="rounded-md border bg-muted/40 p-4 text-sm">
      <p class="font-medium">更改已保存</p>
      <p class="mt-1 text-muted-foreground">操作结果适合显示在表单区域；字段错误应放在对应输入框下。</p>
    </div>
    <div role="alert" class="rounded-md border border-destructive/40 p-4 text-sm text-destructive">
      <p class="font-medium">保存失败</p>
      <p class="mt-1">请检查网络连接后重试，当前输入内容已保留。</p>
    </div>
  </div>
</template>
