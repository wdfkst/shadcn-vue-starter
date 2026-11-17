import { describe, expect, it } from 'vitest'
import { workbenchModules, workbenchShortcuts } from '../src/lib/workbench'
import type { NavItem } from '../src/lib/system-data'

const nav = (path: string, permission?: string): NavItem => ({
  title: path,
  path,
  group: 'g',
  permission,
  order: 0,
})

describe('workbenchShortcuts', () => {
  const items = [
    nav('/'),
    nav('/system/users', 'users:read'),
    nav('/system/roles', 'roles:read'),
    nav('/business/inventory', 'inventory:read'),
    nav('/settings'),
  ]
  it('drops the workbench, unauthorized and excluded entries', () => {
    const can = (p: string) => p !== 'roles:read'
    expect(workbenchShortcuts(items, can, ['/business/inventory']).map((i) => i.path)).toEqual([
      '/system/users',
      '/settings',
    ])
  })
  it('respects the limit', () => {
    expect(workbenchShortcuts(items, () => true, [], 2)).toHaveLength(2)
  })
})

describe('workbenchModules', () => {
  const generated = [
    { key: 'inventory', title: '库存', route: '/business/inventory', fields: [1, 2] },
    { key: 'noroute', title: '无路由', fields: [] },
  ]
  const published = [
    { key: 'suppliers', title: '供应商', route: '/business/suppliers', fields: [1] },
    { key: 'inventory', title: '库存 v2', route: '/business/inventory', fields: [1, 2, 3] },
  ]
  it('merges sources, prefers published, skips modules without routes', () => {
    const rows = workbenchModules(generated, published, () => true)
    expect(rows.map((r) => [r.key, r.source, r.fieldCount])).toEqual([
      ['inventory', 'published', 3],
      ['suppliers', 'published', 1],
    ])
  })
  it('filters by read permission', () => {
    const rows = workbenchModules(generated, published, (p) => p === 'suppliers:read')
    expect(rows.map((r) => r.key)).toEqual(['suppliers'])
  })
})
