import { describe, expect, it } from 'vitest'
import { hasPermission, safeRead } from '../src/lib/access'
import { createMemoryRepository, validateRecord } from '../src/lib/repository'
const module = {
  key: 'products',
  title: '商品',
  fields: [
    { key: 'name', label: '名称', type: 'text' as const, required: true, list: true, search: true },
    { key: 'price', label: '价格', type: 'number' as const, required: true, list: true },
  ],
}
describe('access', () => {
  it('handles denied and corrupt storage', () => {
    expect(
      safeRead(
        {
          getItem() {
            throw Error('denied')
          },
        } as Storage,
        'x',
        null,
      ),
    ).toBe(null)
    expect(safeRead({ getItem: () => '{' } as Storage, 'x', [])).toEqual([])
  })
  it('viewer reads but cannot mutate', () => {
    expect(hasPermission('viewer', 'products:read')).toBe(true)
    expect(hasPermission('viewer', 'products:create')).toBe(false)
    expect(hasPermission('admin', 'products:delete')).toBe(true)
    expect(hasPermission(null, 'products:read')).toBe(false)
  })
})
describe('repository', () => {
  it('validates required and finite numbers', () => {
    expect(() => validateRecord(module, { name: ' ', price: 4 })).toThrow()
    expect(() => validateRecord(module, { name: 'A', price: 'oops' })).toThrow()
    expect(validateRecord(module, { name: 'A', price: '0' })).toMatchObject({ name: 'A', price: 0 })
  })
  it('supports create filter update delete with authorization', async () => {
    const repo = createMemoryRepository(module, [])
    const row = await repo.create({ name: 'A', price: 0 }, 'admin')
    expect((await repo.list({ query: 'A', page: 1, pageSize: 10 })).total).toBe(1)
    await expect(repo.update(row.id, { name: 'B', price: 1 }, 'viewer')).rejects.toThrow()
    await repo.update(row.id, { name: 'B', price: 1 }, 'admin')
    expect((await repo.list({ query: 'A' })).total).toBe(0)
    await repo.remove(row.id, 'admin')
    expect((await repo.list({})).total).toBe(0)
  })
  it('rejects impossible dates and preserves explicit false', () => {
    const dates = {
      key: 'dates',
      title: '日期',
      fields: [
        { key: 'date', label: '日期', type: 'date' as const },
        { key: 'enabled', label: '启用', type: 'boolean' as const, required: true },
      ],
    }
    expect(() => validateRecord(dates, { date: '2026-02-30', enabled: false })).toThrow()
    expect(validateRecord(dates, { date: '2026-02-28', enabled: false })).toMatchObject({
      date: '2026-02-28',
      enabled: false,
    })
  })
  it('collects every field error instead of the first', async () => {
    const { collectRecordErrors } = await import('../src/lib/repository')
    const result = collectRecordErrors(
      {
        ...module,
        fields: [...module.fields, { key: 'day', label: '日期', type: 'date' as const, list: true }],
      },
      { name: '  ', price: 'abc', day: '2026-13-40' },
    )
    expect(result.errors).toEqual(['名称不能为空', '价格必须是有效数字', '日期必须是有效日期'])
    expect(() => validateRecord(module, { name: '', price: 1 })).toThrow('名称不能为空')
  })
  it('rejects writes on logs', async () => {
    const repo = createMemoryRepository({ ...module, readOnly: true }, [])
    await expect(repo.create({ name: 'A', price: 1 }, 'admin')).rejects.toThrow()
  })
})
