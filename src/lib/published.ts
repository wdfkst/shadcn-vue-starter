import { ref, watch } from 'vue'
import { validateConfig, type GeneratorConfig } from '../generator/core.mjs'
import { readLocal, writeLocal } from './access'
import type { DataRow } from '@/types/module'

export const PUBLISHED_KEY = 'admin-published-modules'

const stored = readLocal<unknown[]>(PUBLISHED_KEY, [])
export const publishedModules = ref<GeneratorConfig[]>(
  (Array.isArray(stored) ? stored : []).flatMap((item) => {
    try {
      return [validateConfig(item) as GeneratorConfig]
    } catch {
      return []
    }
  }),
)
watch(publishedModules, (value) => writeLocal(PUBLISHED_KEY, value), { deep: true })

export type PublishContext = { menus: DataRow[]; reservedKeys: string[]; reservedRoutes: string[] }
export type PublishResult = { ok: true } | { ok: false; reason: string }

export function menuRowFor(config: GeneratorConfig): DataRow {
  return {
    id: 'published-' + config.key,
    name: config.title,
    parent: '业务模块',
    path: config.route,
    permission: config.key + ':read',
    order: 100,
    status: '正常',
    icon: 'box',
  }
}

export function publishModule(config: GeneratorConfig, ctx: PublishContext): PublishResult {
  const current = publishedModules.value
  const own = current.find((c) => c.key === config.key)
  if (ctx.reservedKeys.includes(config.key) || current.some((c) => c.key === config.key && c !== own))
    return { ok: false, reason: '模块标识已被占用' }
  if (
    ctx.reservedRoutes.includes(config.route) ||
    current.some((c) => c.route === config.route && c.key !== config.key)
  )
    return { ok: false, reason: '路由地址已被占用' }
  const next = own
    ? current.map((c) => (c.key === config.key ? config : c))
    : [...current, config]
  if (!writeLocal(PUBLISHED_KEY, next)) return { ok: false, reason: '本地存储已满，发布失败' }
  publishedModules.value = next
  return { ok: true }
}

export function unpublishModule(key: string) {
  publishedModules.value = publishedModules.value.filter((c) => c.key !== key)
}

export function publishedPermission(
  path: string,
  configs: { key: string; route: string }[],
): string {
  const match = configs.find((c) => c.route === path)
  return match ? match.key + ':read' : ''
}

// `??` cannot express this chain: an empty string from publishedPermission must fall through.
export function routePermission(
  menuPermission: string | undefined,
  path: string,
  configs: { key: string; route: string }[],
  metaPermission: unknown,
): string {
  return (
    menuPermission ||
    publishedPermission(path, configs) ||
    (metaPermission ? String(metaPermission) : '')
  )
}
