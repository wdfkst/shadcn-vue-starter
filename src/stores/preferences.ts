import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { readLocal, writeLocal } from '@/lib/access'
export const usePreferences = defineStore('preferences', () => {
  const theme = ref(readLocal<string>('admin-theme', 'light') === 'dark' ? 'dark' : 'light')
  const collapsed = ref(readLocal<boolean>('admin-collapsed', false) === true)
  const inset = ref(readLocal<boolean>('admin-inset', true) !== false)
  watch(
    theme,
    (v) => {
      document.documentElement.classList.toggle('dark', v === 'dark')
      writeLocal('admin-theme', v)
    },
    { immediate: true },
  )
  watch(collapsed, (v) => writeLocal('admin-collapsed', v))
  watch(inset, (v) => writeLocal('admin-inset', v))
  return { theme, collapsed, inset }
})
