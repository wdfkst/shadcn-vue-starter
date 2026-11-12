import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { hasPermission, readLocal, writeLocal } from '@/lib/access'
import { http, mockMode } from '@/lib/repository'
import { useSystem, systemRows } from './system'
import type { Role } from '@/types/module'
interface Session {
  username: string
  role: Role
}
export const useAuth = defineStore('auth', () => {
  const stored = readLocal<Session | null>('admin-session', null)
  const session = ref<Session | null>(
    stored && typeof stored.username === 'string' && ['admin', 'viewer'].includes(stored.role)
      ? stored
      : null,
  )
  const role = computed(() => session.value?.role ?? null)
  // Role rows edited in 角色管理 take effect immediately; the built-in rules stay
  // as a fallback when no matching role row exists.
  const can = (permission: string) => {
    if (!role.value) return false
    const system = useSystem()
    const name = role.value === 'admin' ? '管理员' : role.value === 'viewer' ? '只读成员' : role.value
    const row = systemRows.roles.value.find((r) => r.name === name)
    return row ? system.allows(name, permission) : hasPermission(role.value, permission)
  }
  async function login(username: string, password: string) {
    if (mockMode) {
      const accounts = readLocal<Record<string, string>>('admin-mock-accounts', {})
      if (['admin', 'viewer'].includes(username) && password === 'admin123')
        session.value = { username, role: username as Role }
      else if (Object.hasOwn(accounts, username) && accounts[username] === password)
        session.value = { username, role: 'viewer' }
      else throw Error('账号或密码错误')
    } else {
      const { data } = await http.post('/auth/login', { username, password })
      if (!data.token || !['admin', 'viewer'].includes(data.user?.role))
        throw Error('登录响应格式不正确')
      writeLocal('admin-access-token', data.token)
      session.value = data.user
    }
    writeLocal('admin-session', session.value)
  }
  // Mock registration creates a read-only account in localStorage (demo only, not secure).
  async function register(username: string, password: string) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(username))
      throw Error('账号需以字母开头，3-20 位字母、数字或下划线')
    if (password.length < 6) throw Error('密码至少 6 位')
    if (mockMode) {
      const accounts = readLocal<Record<string, string>>('admin-mock-accounts', {})
      if (['admin', 'viewer'].includes(username) || accounts[username]) throw Error('账号已存在')
      accounts[username] = password
      writeLocal('admin-mock-accounts', accounts)
    } else {
      await http.post('/auth/register', { username, password })
    }
  }
  function logout() {
    session.value = null
    writeLocal('admin-session', null)
    writeLocal('admin-access-token', '')
  }
  return { session, role, can, login, register, logout }
})
