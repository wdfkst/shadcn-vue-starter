<script setup lang="ts">
import { reactive, ref } from 'vue'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import { usePreferences } from '@/stores/preferences'
import { readLocal, writeLocal } from '@/lib/access'
const prefs = usePreferences(),
  name = ref(readLocal('admin-profile-name', '演示管理员')),
  bio = ref(readLocal('admin-profile-bio', '')),
  fieldErrors = reactive<Record<string, string>>({}),
  message = ref('')
function save() {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  if (!name.value.trim()) {
    fieldErrors.name = '显示名称不能为空'
    return
  }
  message.value =
    writeLocal('admin-profile-name', name.value) && writeLocal('admin-profile-bio', bio.value)
      ? '个人资料已保存在当前浏览器'
      : '浏览器不允许保存本地数据'
}
</script>
<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">设置</h1>
      <p class="mt-1 text-sm text-muted-foreground">管理你的个人资料和工作空间偏好。</p>
    </div>
    <div class="border-t pt-6 md:flex md:gap-12">
      <aside class="mb-6 w-44 text-sm">
        <div class="rounded-md bg-accent px-3 py-2 font-medium">个人资料与外观</div>
      </aside>
      <form class="max-w-xl flex-1 space-y-6" @submit.prevent="save">
        <div>
          <h2 class="text-lg font-medium">个人资料</h2>
          <p class="mt-1 text-sm text-muted-foreground">演示资料仅保存在本机，不会更改登录身份。</p>
        </div>
        <div class="space-y-1.5">
          <label for="display-name" class="text-sm font-medium">显示名称</label
          ><Input id="display-name" v-model="name" :aria-invalid="!!fieldErrors.name || undefined" />
          <p v-if="fieldErrors.name" role="alert" class="text-sm text-destructive">
            {{ fieldErrors.name }}
          </p>
        </div>
        <div class="space-y-2">
          <label for="bio" class="text-sm font-medium">个人简介</label
          ><textarea
            id="bio"
            v-model="bio"
            class="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
          />
        </div>
        <div class="border-t pt-6">
          <h2 class="mb-4 text-lg font-medium">外观</h2>
          <div class="flex gap-3">
            <Button
              type="button"
              :variant="prefs.theme === 'light' ? 'default' : 'outline'"
              @click="prefs.theme = 'light'"
              >浅色主题</Button
            ><Button
              type="button"
              :variant="prefs.theme === 'dark' ? 'default' : 'outline'"
              @click="prefs.theme = 'dark'"
              >深色主题</Button
            >
          </div>
        </div>
        <p v-if="message" role="status" class="text-sm text-muted-foreground">{{ message }}</p>
        <Button type="submit">保存资料</Button>
      </form>
    </div>
  </div>
</template>
