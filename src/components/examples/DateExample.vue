<script setup lang="ts">
import { ref } from 'vue'
import DatePicker from '@/components/ui/date-picker/DatePicker.vue'
import Button from '@/components/ui/button/Button.vue'

const date = ref('')
</script>

<template>
  <div class="w-full max-w-sm space-y-3">
    <label for="example-date" class="text-sm font-medium">计划日期</label>
    <DatePicker id="example-date" v-model="date" />
    <div class="flex items-center justify-between gap-3">
      <p role="status" class="text-sm text-muted-foreground">绑定值：{{ date || '未选择' }}</p>
      <Button type="button" variant="ghost" size="sm" :disabled="!date" @click="date = ''">清空</Button>
    </div>
  </div>
</template>
