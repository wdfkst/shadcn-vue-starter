import { computed, ref, watch } from 'vue'
import type { DataRow } from '@/types/module'
import { readLocal, writeLocal } from './access'

// Shared live view of the role / menu / dictionary rows, so edits made in the
// management pages take effect in the sidebar, route guard and forms at once.
export function useSystemRows(key: string, seed: DataRow[]) {
  const saved = readLocal<unknown>(`admin-data:${key}`, null)
  const rows = ref<DataRow[]>(
    Array.isArray(saved) &&
      saved.every((r) => r && typeof r === 'object' && typeof (r as DataRow).id === 'string')
      ? (saved as DataRow[])
      : seed.map((r) => ({ ...r })),
  )
  if (import.meta.env.VITE_USE_MOCK !== 'false') {
    watch(
      rows,
      (value) => writeLocal(`admin-data:${key}`, value),
      { deep: true },
    )
  }
  return rows
}

// "users:*" matches "users:read"; "*:*" matches everything; "*:read" matches any read.
export function permissionMatches(granted: string, required: string) {
  if (granted === '*') return true
  const [gModule, gAction] = granted.split(':')
  const [rModule, rAction] = required.split(':')
  return (gModule === '*' || gModule === rModule) && (gAction === '*' || gAction === rAction)
}

export function roleAllows(roleRows: DataRow[], roleName: string, permission: string) {
  const role = roleRows.find((r) => r.name === roleName && r.status !== '停用')
  if (!role) return false
  return String(role.permissions ?? '')
    .split(/[,，\s]+/)
    .filter(Boolean)
    .some((granted) => permissionMatches(granted, permission))
}

export interface NavItem {
  title: string
  path: string
  icon?: string
  group: string
  permission?: string
  order: number
}

// Menu rows become navigation entries. Rows without a parent act as group headers.
export function buildNavigation(menuRows: DataRow[]): NavItem[] {
  const active = menuRows.filter((r) => r.status !== '停用')
  return active
    .filter((r) => r.parent)
    .map((r) => ({
      title: String(r.name),
      path: String(r.path ?? ''),
      icon: String(r.icon ?? ''),
      group: String(r.parent),
      permission: r.permission ? String(r.permission) : undefined,
      order: Number(r.order ?? 0),
    }))
    .filter((item) => item.path.startsWith('/'))
    .sort((a, b) => a.order - b.order)
}

export function dictionaryOptions(rows: DataRow[], type: string): string[] {
  return rows
    .filter((r) => r.type === type && r.status !== '停用')
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
    .map((r) => String(r.label))
}

export function useDictionary(type: string, rows: { value: DataRow[] }) {
  return computed(() => dictionaryOptions(rows.value, type))
}
