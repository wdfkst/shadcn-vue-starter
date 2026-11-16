<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <Button type="button">保存更改</Button>
    <Button type="button" variant="secondary">次要操作</Button>
    <Button type="button" variant="outline">取消</Button>
    <Button type="button" variant="ghost">查看详情</Button>
    <Button type="button" variant="destructive">删除</Button>
    <Button type="button" disabled>不可操作</Button>
  </div>
</template>
