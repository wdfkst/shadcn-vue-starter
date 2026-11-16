import { defineStore } from 'pinia'
import { computed } from 'vue'
import { systemModules } from '@/modules/registry'
import { useSystemRows, roleAllows, buildNavigation, dictionaryOptions } from '@/lib/system-data'
import type { DataRow } from '@/types/module'
import type { Ref } from 'vue'

const seed = (key: string) => systemModules.find((m) => m.key === key)?.seed ?? []

// Held outside the store so callers get the reactive ref itself. Pinia unwraps
// refs returned from a store, which would break the shared read/write handle.
export const systemRows: Record<'roles' | 'menus' | 'dictionaries', Ref<DataRow[]>> = {
  roles: useSystemRows('roles', seed('roles')),
  menus: useSystemRows('menus', seed('menus')),
  dictionaries: useSystemRows('dictionaries', seed('dictionaries')),
}

export const useSystem = defineStore('system', () => {
  const navigation = computed(() => {
    const items = buildNavigation(systemRows.menus.value)
    // Built-in documentation is available even with previously saved menu data.
    // An explicit menu row (including a disabled one) takes precedence.
    if (!systemRows.menus.value.some((row) => row.path === '/tools/components')) {
      items.push({ title: '组件示例', path: '/tools/components', icon: 'box', group: '开发工具', order: 99 })
    }
    return items
  })
  const options = (type: string) => dictionaryOptions(systemRows.dictionaries.value, type)
  const allows = (roleName: string, permission: string) =>
    roleAllows(systemRows.roles.value, roleName, permission)
  return { navigation, options, allows }
})
