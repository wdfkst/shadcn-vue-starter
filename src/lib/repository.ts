import axios from 'axios'
import type { DataRow, ModuleDefinition, Repository, Role } from '@/types/module'
import { hasPermission, readLocal, writeLocal } from './access'
import { systemRows } from '@/stores/system'
import { dictionaryOptions } from './system-data'
export function collectRecordErrors(
  module: ModuleDefinition,
  input: Record<string, unknown>,
): { values: Omit<DataRow, 'id'>; errors: string[] } {
  const out: Record<string, string | number | boolean> = {}
  const errors: string[] = []
  for (const field of module.fields) {
    const value = input[field.key]
    if (field.required && (value === undefined || value === null || String(value).trim() === ''))
      errors.push(`${field.label}不能为空`)
    if (field.type === 'number') {
      if (value === '' || value == null) {
        out[field.key] = ''
        continue
      }
      const n = Number(value)
      if (!Number.isFinite(n)) errors.push(`${field.label}必须是有效数字`)
      else out[field.key] = n
    } else if (field.type === 'boolean') {
      out[field.key] = value === true || value === 'true'
    } else {
      const str = String(value ?? '').trim()
      const allowed = field.dictType
        ? dictionaryOptions(systemRows.dictionaries.value, field.dictType)
        : (field.options ?? [])
      if (field.type === 'select' && str && !allowed.includes(str))
        errors.push(`${field.label}选项无效`)
      if (field.type === 'date' && str) {
        const parsed = new Date(str)
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(str) ||
          !Number.isFinite(parsed.getTime()) ||
          parsed.toISOString().slice(0, 10) !== str
        )
          errors.push(`${field.label}必须是有效日期`)
      }
      out[field.key] = str
    }
  }
  return { values: out, errors }
}
export function validateRecord(
  module: ModuleDefinition,
  input: Record<string, unknown>,
): Omit<DataRow, 'id'> {
  const { values, errors } = collectRecordErrors(module, input)
  if (errors.length) throw Error(errors[0])
  return values
}
export function createMemoryRepository(
  module: ModuleDefinition,
  initial: DataRow[],
  persist?: (rows: DataRow[]) => void,
  shared?: { value: DataRow[] },
): Repository {
  let local = initial.map((r) => ({ ...r }))
  const read = () => (shared ? (shared.value ?? []) : local)
  const write = (next: DataRow[]) => {
    if (shared) shared.value = next
    else local = next
    persist?.(next)
  }
  const authorize = (role: Role, action: string) => {
    if (module.readOnly || !hasPermission(role, `${module.key}:${action}`))
      throw Error('没有操作权限')
  }
  return {
    async list(q) {
      let filtered = read().filter(
        (r) =>
          (!q.query ||
            module.fields
              .filter((f) => f.search)
              .some((f) =>
                String(r[f.key] ?? '')
                  .toLowerCase()
                  .includes(q.query!.toLowerCase()),
              )) &&
          Object.entries(q.filters ?? {}).every(([k, v]) => !v || String(r[k]) === v),
      )
      const size = q.pageSize === 0 ? filtered.length || 1 : Math.max(1, q.pageSize ?? 10),
        start = (Math.max(1, q.page ?? 1) - 1) * size
      return {
        items: filtered.slice(start, start + size).map((r) => ({ ...r })),
        total: filtered.length,
      }
    },
    async create(input, role) {
      authorize(role, 'create')
      const row = { ...validateRecord(module, input), id: crypto.randomUUID() } as DataRow
      write([row, ...read()])
      return { ...row }
    },
    async update(id, input, role) {
      authorize(role, 'update')
      const index = read().findIndex((r) => r.id === id)
      if (index < 0) throw Error('记录不存在')
      const row = { ...validateRecord(module, input), id } as DataRow
      const next = read().map((r, i) => (i === index ? row : r))
      write(next)
      return { ...row }
    },
    async remove(id, role) {
      authorize(role, 'delete')
      if (!read().some((r) => r.id === id)) throw Error('记录不存在')
      write(read().filter((r) => r.id !== id))
    },
  }
}
export const mockMode = import.meta.env.VITE_USE_MOCK !== 'false'
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})
http.interceptors.request.use((config) => {
  const token = readLocal<string>('admin-access-token', '')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
http.interceptors.response.use(
  (r) => r,
  (error) =>
    Promise.reject(new Error(error.response?.data?.message || error.message || '请求失败')),
)
const cache = new Map<string, Repository>()
function loadRows(module: ModuleDefinition): DataRow[] {
  const saved = readLocal<unknown>(`admin-data:${module.key}`, null)
  return Array.isArray(saved) &&
    saved.every((r) => r && typeof r === 'object' && typeof (r as DataRow).id === 'string')
    ? (saved as DataRow[])
    : (module.seed ?? [])
}
export function getRepository(module: ModuleDefinition): Repository {
  if (cache.has(module.key)) return cache.get(module.key)!
  let repo: Repository
  if (mockMode) {
    const linked: Record<string, 'roles' | 'menus' | 'dictionaries'> = {
      roles: 'roles',
      menus: 'menus',
      dictionaries: 'dictionaries',
    }
    const shared = linked[module.key] ? systemRows[linked[module.key]!] : null
    repo = createMemoryRepository(
      module,
      shared ? [] : loadRows(module),
      (data) => writeLocal(`admin-data:${module.key}`, data),
      shared ?? undefined,
    )
    // Linked repositories read the live store, so they must not be cached
    // before the store has finished populating its rows.
    if (!shared) cache.set(module.key, repo)
  } else {
    const url = module.endpoint || `/${module.key}`
    repo = {
      async list(q) {
        return (await http.get(url, { params: q })).data
      },
      async create(row) {
        return (await http.post(url, row)).data
      },
      async update(id, row) {
        return (await http.put(`${url}/${encodeURIComponent(id)}`, row)).data
      },
      async remove(id) {
        await http.delete(`${url}/${encodeURIComponent(id)}`)
      },
    }
  }
  cache.set(module.key, repo)
  return repo
}
