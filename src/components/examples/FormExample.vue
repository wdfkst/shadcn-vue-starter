<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'

const name = ref('')
const error = ref('')
const saved = ref(false)
function submit() {
  saved.value = false
  error.value = name.value.trim() ? '' : '请输入显示名称'
  if (!error.value) saved.value = true
}
function clearFeedback() {
  error.value = ''
  saved.value = false
}
</script>

<template>
  <form class="w-full max-w-sm space-y-4" novalidate @submit.prevent="submit">
    <div class="space-y-1.5">
      <label for="example-name" class="text-sm font-medium">显示名称 <span class="text-destructive">*</span></label>
      <Input id="example-name" v-model="name" placeholder="输入名称，或留空测试校验"
        :aria-invalid="!!error || undefined" :aria-describedby="error ? 'example-name-error' : undefined"
        @update:model-value="clearFeedback" />
      <p v-if="error" id="example-name-error" role="alert" class="text-sm text-destructive">{{ error }}</p>
    </div>
    <Button type="submit">验证表单</Button>
    <p v-if="saved" role="status" class="text-sm text-muted-foreground">校验通过。此示例不会保存业务数据。</p>
  </form>
</template>
