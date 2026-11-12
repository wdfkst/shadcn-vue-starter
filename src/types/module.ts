export type FieldType = 'text' | 'number' | 'select' | 'boolean' | 'date' | 'textarea'
export interface Field {
  key: string
  label: string
  type: FieldType
  required?: boolean
  list?: boolean
  search?: boolean
  options?: string[]
}
export interface ModuleDefinition {
  key: string
  title: string
  description?: string
  fields: Field[]
  readOnly?: boolean
  route?: string
  endpoint?: string
  seed?: DataRow[]
}
export type DataRow = { id: string; [key: string]: string | number | boolean }
export type Role = 'admin' | 'viewer'
export interface ListQuery {
  query?: string
  filters?: Record<string, string>
  page?: number
  pageSize?: number
}
export interface Repository {
  list(q: ListQuery): Promise<{ items: DataRow[]; total: number }>
  create(row: Record<string, unknown>, role: Role): Promise<DataRow>
  update(id: string, row: Record<string, unknown>, role: Role): Promise<DataRow>
  remove(id: string, role: Role): Promise<void>
}
