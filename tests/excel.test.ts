import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { exportRows, parseWorkbook, templateWorkbook } from '../src/lib/excel'
import type { ModuleDefinition } from '../src/types/module'

const module: ModuleDefinition = {
  key: 'goods',
  title: '商品',
  fields: [
    { key: 'name', label: '名称', type: 'text', required: true, list: true },
    { key: 'price', label: '价格', type: 'number', required: true, list: true },
    { key: 'on', label: '上架', type: 'boolean', list: true },
    { key: 'day', label: '日期', type: 'date', list: true },
    { key: 'kind', label: '分类', type: 'select', options: ['A', 'B'], list: true },
    { key: 'note', label: '备注', type: 'text', list: false },
  ],
}

async function sheet(headers: string[], data: unknown[][]) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('数据')
  ws.addRow(headers)
  for (const row of data) ws.addRow(row)
  return wb.xlsx.writeBuffer()
}

describe('excel', () => {
  it('round-trips a row through export and parse', async () => {
    const blob = await exportRows(module, [
      { id: '1', name: '钢笔', price: 12, on: true, day: '2026-11-13', kind: 'A', note: '隐藏' },
    ])
    const parsed = await parseWorkbook(module, await blob.arrayBuffer())
    expect(parsed.error).toBeUndefined()
    expect(parsed.rows).toHaveLength(1)
    expect(parsed.rows[0]!.errors).toEqual([])
    expect(parsed.rows[0]!.values).toMatchObject({
      name: '钢笔',
      price: 12,
      on: true,
      day: '2026-11-13',
      kind: 'A',
    })
    expect(parsed.rows[0]!.values.note).toBe('')
  })

  it('reports a missing header as a whole-file error', async () => {
    const buf = await sheet(['名称', '价格'], [['钢笔', 1]])
    const parsed = await parseWorkbook(module, buf)
    expect(parsed.error).toContain('表头')
    expect(parsed.rows).toEqual([])
  })

  it('maps columns by trimmed label regardless of order', async () => {
    const buf = await sheet(
      [' 分类 ', '日期', '上架', '价格', '名称'],
      [['A', '2026-11-13', '是', 3, '钢笔']],
    )
    const parsed = await parseWorkbook(module, buf)
    expect(parsed.rows[0]!.errors).toEqual([])
    expect(parsed.rows[0]!.values).toMatchObject({ name: '钢笔', kind: 'A', price: 3 })
  })

  it('collects every error on one row', async () => {
    const buf = await sheet(
      ['名称', '价格', '上架', '日期', '分类'],
      [['  ', 'abc', '是', '2026-13-40', 'A']],
    )
    const parsed = await parseWorkbook(module, buf)
    expect(parsed.rows[0]!.errors).toEqual([
      '名称不能为空',
      '价格必须是有效数字',
      '日期必须是有效日期',
    ])
  })

  it('accepts the documented boolean spellings and rejects the rest', async () => {
    const headers = ['名称', '价格', '上架', '日期', '分类']
    const row = (on: unknown) => ['钢笔', 1, on, '2026-11-13', 'A']
    for (const on of ['是', '否', 'true', 'false', '1', '0', '', null]) {
      const parsed = await parseWorkbook(module, await sheet(headers, [row(on)]))
      expect(parsed.rows[0]!.errors, String(on)).toEqual([])
    }
    const bad = await parseWorkbook(module, await sheet(headers, [row('abc')]))
    expect(bad.rows[0]!.errors.join('；')).toContain('只能填写是或否')
  })

  it('skips fully empty rows', async () => {
    const buf = await sheet(
      ['名称', '价格', '上架', '日期', '分类'],
      [
        ['钢笔', 1, '是', '2026-11-13', 'A'],
        [null, null, null, null, null],
      ],
    )
    const parsed = await parseWorkbook(module, buf)
    expect(parsed.rows).toHaveLength(1)
  })

  it('rejects more than 5000 rows', async () => {
    const rows = Array.from({ length: 5001 }, () => ['钢笔', 1, '是', '2026-11-13', 'A'])
    const parsed = await parseWorkbook(
      module,
      await sheet(['名称', '价格', '上架', '日期', '分类'], rows),
    )
    expect(parsed.error).toContain('5000')
    expect(parsed.rows).toEqual([])
  })

  it('coerces numeric text cells, formula results, hyperlinks and dates', async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('数据')
    ws.addRow(['名称', '价格', '上架', '日期', '分类'])
    const row = ws.addRow([1, 2, '是', new Date(2026, 10, 13), 'A'])
    row.getCell(1).value = { formula: '1+1', result: '计算值' } as ExcelJS.CellFormulaValue
    const link = ws.addRow(['x', 2, '是', '2026-11-13', 'A'])
    link.getCell(1).value = { text: '链接', hyperlink: 'https://example.com' }
    const parsed = await parseWorkbook(module, await wb.xlsx.writeBuffer())
    expect(parsed.rows[0]!.values.name).toBe('计算值')
    expect(parsed.rows[0]!.values.day).toBe('2026-11-13')
    expect(parsed.rows[1]!.values.name).toBe('链接')
    const numeric = await parseWorkbook(
      module,
      await sheet(['名称', '价格', '上架', '日期', '分类'], [[1, 2, '否', '2026-11-13', 'B']]),
    )
    expect(numeric.rows[0]!.values.name).toBe('1')
  })

  it('appends an extra column and sets text columns to text format', async () => {
    const blob = await exportRows(
      module,
      [{ id: '1', name: '钢笔', price: 1, on: false, day: '2026-11-13', kind: 'A' }],
      { header: '错误原因', values: ['价格必须是有效数字'] },
    )
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await blob.arrayBuffer())
    const ws = wb.worksheets[0]!
    expect(ws.getRow(1).getCell(5).value).toBe('分类')
    expect(ws.getRow(1).getCell(6).value).toBe('错误原因')
    expect(ws.getRow(2).getCell(6).value).toBe('价格必须是有效数字')
    expect(ws.getColumn(1).numFmt).toBe('@')
    const tpl = await templateWorkbook(module, () => ['甲', '乙'])
    const tw = new ExcelJS.Workbook()
    await tw.xlsx.load(await tpl.arrayBuffer())
    expect(tw.getWorksheet('填写说明')).toBeTruthy()
  })
})
