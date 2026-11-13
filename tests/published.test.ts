import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, string>()
vi.mock('../src/lib/access', () => ({
  readLocal: (key: string, fallback: unknown) => {
    const value = store.get(key)
    return value === undefined ? fallback : JSON.parse(value)
  },
  writeLocal: (key: string, value: unknown) => {
    if (store.get('__fail') === '1') return false
    store.set(key, JSON.stringify(value))
    return true
  },
}))

const valid = {
  key: 'suppliers',
  title: '供应商',
  route: '/business/suppliers',
  fields: [{ key: 'name', label: '名称', type: 'text', required: true, list: true, search: false }],
}

let published: typeof import('../src/lib/published')

beforeEach(async () => {
  store.clear()
  vi.resetModules()
  published = await import('../src/lib/published')
})

describe('published modules', () => {
  it('drops invalid stored configs', async () => {
    store.set('admin-published-modules', JSON.stringify([valid, { key: 'broken' }]))
    vi.resetModules()
    const mod = await import('../src/lib/published')
    expect(mod.publishedModules.value.map((c) => c.key)).toEqual(['suppliers'])
  })

  it('builds the menu row', () => {
    expect(published.menuRowFor(valid)).toMatchObject({
      id: 'published-suppliers',
      name: '供应商',
      parent: '业务模块',
      path: '/business/suppliers',
      permission: 'suppliers:read',
      status: '正常',
    })
  })

  it('rejects a reserved key and a taken route', () => {
    const ctx = { menus: [], reservedKeys: ['users'], reservedRoutes: ['/business/inventory'] }
    expect(published.publishModule({ ...valid, key: 'users' }, ctx)).toMatchObject({
      ok: false,
      reason: '模块标识已被占用',
    })
    expect(
      published.publishModule({ ...valid, route: '/business/inventory' }, ctx),
    ).toMatchObject({ ok: false, reason: '路由地址已被占用' })
  })

  it('overwrites the same key and keeps memory unchanged when storage fails', () => {
    const ctx = { menus: [], reservedKeys: [], reservedRoutes: [] }
    expect(published.publishModule(valid, ctx)).toEqual({ ok: true })
    expect(
      published.publishModule({ ...valid, title: '供应商管理' }, ctx),
    ).toEqual({ ok: true })
    expect(published.publishedModules.value).toHaveLength(1)
    expect(published.publishedModules.value[0]!.title).toBe('供应商管理')

    store.set('__fail', '1')
    const result = published.publishModule({ ...valid, key: 'vendors', route: '/business/vendors' }, ctx)
    expect(result).toMatchObject({ ok: false, reason: '本地存储已满，发布失败' })
    expect(published.publishedModules.value.map((c) => c.key)).toEqual(['suppliers'])
  })

  it('removes the config on unpublish but not its data', () => {
    published.publishModule(valid, { menus: [], reservedKeys: [], reservedRoutes: [] })
    store.set('admin-data:suppliers', '[]')
    published.unpublishModule('suppliers')
    expect(published.publishedModules.value).toEqual([])
    expect(store.has('admin-data:suppliers')).toBe(true)
  })

  it('resolves the permission of a published path', () => {
    const configs = [{ key: 'suppliers', route: '/business/suppliers' }]
    expect(published.publishedPermission('/business/suppliers', configs)).toBe('suppliers:read')
    expect(published.publishedPermission('/business/unknown', configs)).toBe('')
    expect(published.publishedPermission('/business/Suppliers', configs)).toBe('')
  })

  it('falls back from menu to published config to route meta', () => {
    const configs = [{ key: 'suppliers', route: '/business/suppliers' }]
    const { routePermission } = published
    expect(routePermission('menus:read', '/business/suppliers', configs, 'x')).toBe('menus:read')
    expect(routePermission(undefined, '/business/suppliers', configs, '')).toBe('suppliers:read')
    expect(routePermission(undefined, '/business/inventory', configs, 'inventory:read')).toBe(
      'inventory:read',
    )
    expect(routePermission(undefined, '/settings', configs, undefined)).toBe('')
  })
})
