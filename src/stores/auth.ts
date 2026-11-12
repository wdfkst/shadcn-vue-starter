import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { hasPermission, readLocal, writeLocal } from '@/lib/access'
import { http, mockMode } from '@/lib/repository'
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
  const can = (permission: string) => hasPermission(role.value, permission)
  async function login(username: string, password: string) {
    if (mockMode) {
      if (!['admin', 'viewer'].includes(username) || password !== 'admin123')
        throw Error('账号或密码错误')
      session.value = { username, role: username as Role }
    } else {
      const { data } = await http.post('/auth/login', { username, password })
      if (!data.token || !['admin', 'viewer'].includes(data.user?.role))
        throw Error('登录响应格式不正确')
      writeLocal('admin-access-token', data.token)
      session.value = data.user
    }
    writeLocal('admin-session', session.value)
  }
  function logout() {
    session.value = null
    writeLocal('admin-session', null)
    writeLocal('admin-access-token', '')
  }
  return { session, role, can, login, logout }
})
