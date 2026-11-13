import ExcelJS from 'exceljs'
import type { DataRow, Field, ModuleDefinition } from '@/types/module'
import { collectRecordErrors } from './repository'

const MAX_ROWS = 5000
const listed = (module: ModuleDefinition) => module.fields.filter((f) => f.list !== false)

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return ''
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof value === 'object') {
    const v = value as {
      result?: unknown
      text?: unknown
      richText?: { text: string }[]
    }
    if ('result' in v && v.result != null) return cellText(v.result as ExcelJS.CellValue)
    if (typeof v.text === 'string') return v.text
    if (Array.isArray(v.richText)) return v.richText.map((part) => part.text).join('')
  }
  return String(value)
}

async function workbookBlob(workbook: ExcelJS.Workbook): Promise<Blob> {
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export async function exportRows(
  module: ModuleDefinition,
  rows: DataRow[],
  extra?: { header: string; values: string[] },
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(module.title.slice(0, 31) || 'data')
  const fields = listed(module)
  sheet.addRow([...fields.map((f) => f.label), ...(extra ? [extra.header] : [])])
  rows.forEach((row, i) => {
    sheet.addRow([
      ...fields.map((f) =>
        f.type === 'boolean' ? (row[f.key] ? '是' : '否') : (row[f.key] ?? ''),
      ),
      ...(extra ? [extra.values[i] ?? ''] : []),
    ])
  })
  fields.forEach((f, i) => {
    if (f.type === 'text' || f.type === 'textarea' || f.type === 'date')
      sheet.getColumn(i + 1).numFmt = '@'
  })
  return workbookBlob(workbook)
}

export async function templateWorkbook(
  module: ModuleDefinition,
  optionsOf: (field: Field) => string[] = (f) => f.options ?? [],
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(module.title.slice(0, 31) || 'data')
  const fields = listed(module)
  sheet.addRow(fields.map((f) => f.label))
  fields.forEach((f, i) => {
    if (f.type === 'text' || f.type === 'textarea' || f.type === 'date')
      sheet.getColumn(i + 1).numFmt = '@'
  })
  const help = workbook.addWorksheet('填写说明')
  help.addRow(['字段', '类型', '必填', '可选值'])
  for (const f of fields)
    help.addRow([f.label, f.type, f.required ? '是' : '否', optionsOf(f).join('、')])
  return workbookBlob(workbook)
}

export async function parseWorkbook(
  module: ModuleDefinition,
  file: ArrayBuffer,
): Promise<{ rows: { values: Record<string, unknown>; errors: string[] }[]; error?: string }> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(file)
  const sheet = workbook.worksheets[0]
  if (!sheet) return { rows: [], error: '文件中没有工作表' }
  const fields = listed(module)
  const header = (sheet.getRow(1).values as ExcelJS.CellValue[]).slice(1).map((v) => cellText(v).trim())
  const missing = fields.filter((f) => !header.includes(f.label))
  if (missing.length)
    return { rows: [], error: `表头缺少字段：${missing.map((f) => f.label).join('、')}` }
  const indexOf = (label: string) => header.indexOf(label)

  const rows: { values: Record<string, unknown>; errors: string[] }[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const input: Record<string, unknown> = {}
    let blank = true
    for (const f of fields) {
      const text = cellText(row.getCell(indexOf(f.label) + 1).value).trim()
      if (text !== '') blank = false
      input[f.key] = text
    }
    if (blank) return
    rows.push({ values: input, errors: [] })
  })
  if (rows.length > MAX_ROWS) return { rows: [], error: `单次导入不能超过 ${MAX_ROWS} 行` }

  return {
    rows: rows.map(({ values }) => {
      const errors: string[] = []
      for (const f of fields) {
        if (f.type !== 'boolean') continue
        const text = String(values[f.key] ?? '')
        if (['是', 'true', '1'].includes(text)) values[f.key] = true
        else if (['否', 'false', '0', ''].includes(text)) values[f.key] = false
        else errors.push(`${f.label}只能填写是或否`)
      }
      const collected = collectRecordErrors(module, values)
      return { values: { ...collected.values }, errors: [...errors, ...collected.errors] }
    }),
  }
}
