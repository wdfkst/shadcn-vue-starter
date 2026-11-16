<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'

const open = ref(false)
const confirmed = ref(false)
function confirm() {
  confirmed.value = true
  open.value = false
}
</script>

<template>
  <div class="space-y-3">
    <Button type="button" variant="outline" @click="open = true; confirmed = false">打开确认弹窗</Button>
    <p v-if="confirmed" role="status" class="text-sm text-muted-foreground">已确认，仅演示交互，不会修改数据。</p>
    <Dialog v-model:open="open" title="确认执行操作？" description="在这里说明操作的影响，让用户确认后再继续。" class="max-w-[calc(100vw-2rem)] sm:max-w-lg">
      <div class="flex justify-end gap-2">
        <Button type="button" variant="outline" @click="open = false">取消</Button>
        <Button type="button" @click="confirm">确认</Button>
      </div>
    </Dialog>
  </div>
</template>
