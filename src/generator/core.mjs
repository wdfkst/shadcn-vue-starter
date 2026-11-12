import { z } from 'zod'
const reserved = new Set([
  'id',
  '__proto__',
  'prototype',
  'constructor',
  'default',
  'class',
  'function',
  'var',
  'let',
  'const',
  'export',
  'import',
  'return',
  'new',
  'delete',
  'this',
  'super',
])
const identifier = z
  .string()
  .regex(/^[a-z][a-zA-Z0-9]{0,39}$/, '标识只能由字母开头的字母数字组成')
  .refine((s) => !reserved.has(s), '标识是保留字')
const fieldSchema = z
  .object({
    key: identifier,
    label: z.string().trim().min(1).max(80),
    type: z.enum(['text', 'number', 'select', 'boolean', 'date', 'textarea']),
    required: z.boolean().default(false),
    list: z.boolean().default(true),
    search: z.boolean().default(false),
    options: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  })
  .superRefine((f, c) => {
    if (f.type === 'select' && (!f.options?.length || new Set(f.options).size !== f.options.length))
      c.addIssue({ code: 'custom', message: '选择字段必须有不重复的选项' })
  })
const schema = z
  .object({
    key: identifier.refine(
      (s) =>
        ![
          'users',
          'roles',
          'menus',
          'departments',
          'dictionaries',
          'con',
          'prn',
          'aux',
          'nul',
          'com1',
          'lpt1',
        ].includes(s.toLowerCase()),
      '模块标识已保留',
    ),
    title: z.string().trim().min(1).max(80),
    description: z.string().max(300).default('管理业务数据'),
    route: z
      .string()
      .regex(/^\/business\/[a-z][a-z0-9-]{0,60}$/, '路由格式为 /business/module-name'),
    fields: z.array(fieldSchema).min(1).max(40),
  })
  .superRefine((c, ctx) => {
    if (new Set(c.fields.map((f) => f.key)).size !== c.fields.length)
      ctx.addIssue({ code: 'custom', message: '字段标识不能重复' })
  })
export function validateConfig(input) {
  return schema.parse(input)
}
const stringify = (value) =>
  JSON.stringify(value, null, 2)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')
export function generateFiles(input) {
  const c = validateConfig(input),
    base = `src/modules/generated/${c.key}`,
    definition = { ...c, endpoint: `/${c.key}` }
  const sample = { id: 'demo-1' }
  for (const f of c.fields)
    sample[f.key] =
      f.type === 'number'
        ? 0
        : f.type === 'boolean'
          ? true
          : f.type === 'select'
            ? f.options[0]
            : f.type === 'date'
              ? '2026-11-11'
              : `${f.label}示例`
  return {
    [`${base}/index.vue`]: `<script setup lang="ts">\nimport CrudPage from '@/components/crud/CrudPage.vue'\nimport module from './schema'\nimport { api } from './api'\n</script>\n\n<template>\n  <CrudPage :module="module" :repository="api" />\n</template>\n`,
    [`${base}/schema.ts`]: `import type { ModuleDefinition } from '@/types/module'\nimport { seed } from './mock'\nexport default { ...${stringify(definition)}, seed } satisfies ModuleDefinition\n`,
    [`${base}/types.ts`]: `export interface RecordData {\n  id: string\n${c.fields.map((f) => `  ${f.key}${f.required ? '' : '?'}: ${f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string'}`).join('\n')}\n}\n`,
    [`${base}/api.ts`]: `import { getRepository } from '@/lib/repository'\nimport module from './schema'\n// Customize HTTP behavior here; mock/API switching is centralized.\nexport const api = getRepository(module)\n`,
    [`${base}/mock.ts`]: `import type { DataRow } from '@/types/module'\nexport const seed: DataRow[] = ${stringify([sample])}\n`,
    [`${base}/route.ts`]: `export default { path: ${stringify(c.route)}, name: ${stringify('generated-' + c.key)}, component: () => import('./index.vue'), meta: { title: ${stringify(c.title)}, permission: ${stringify(c.key + ':read')} } }\n`,
    [`generator/${c.key}.json`]: stringify(c) + '\n',
  }
}
