import type { Role } from '@/types/module'
export function hasPermission(role: Role | null, permission: string) {
  return role === 'admin' || (role === 'viewer' && permission.endsWith(':read'))
}
export function safeRead<T>(storage: Pick<Storage, 'getItem'>, key: string, fallback: T): T {
  try {
    const value = storage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch {
    return fallback
  }
}
export function readLocal<T>(key: string, fallback: T): T {
  try {
    return safeRead(localStorage, key, fallback)
  } catch {
    return fallback
  }
}
export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
