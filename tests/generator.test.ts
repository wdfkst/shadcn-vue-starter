import { describe, it, expect } from 'vitest'
import { mkdtemp, readFile, writeFile, mkdir, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { validateConfig, generateFiles } from '../src/generator/core.mjs'
import { writeFiles } from '../cli/writer.mjs'
const config = {
  key: 'products',
  title: '商品管理',
  route: '/business/products',
  fields: [
    { key: 'name', label: '商品名称', type: 'text', required: true, list: true, search: true },
  ],
}
describe('generator', () => {
  it('keeps dictType on select fields and rejects it elsewhere', () => {
    const files = generateFiles({
      ...config,
      fields: [
        {
          key: 'category',
          label: '分类',
          type: 'select',
          options: ['办公用品'],
          dictType: 'sys_category',
        },
      ],
    })
    expect(files['src/modules/generated/products/schema.ts']).toContain('"dictType": "sys_category"')
    expect(() =>
      validateConfig({
        ...config,
        fields: [{ key: 'name', label: '名称', type: 'text', dictType: 'sys_status' }],
      }),
    ).toThrow()
    expect(() =>
      validateConfig({
        ...config,
        fields: [
          { key: 'category', label: '分类', type: 'select', options: ['A'], dictType: 'Bad Type' },
        ],
      }),
    ).toThrow()
  })
  it('rejects traversal, invalid identifiers and duplicate fields', () => {
    for (const key of ['../escape', 'foo/bar', 'CON', 'users'])
      expect(() => validateConfig({ ...config, key })).toThrow()
    expect(() => validateConfig({ ...config, route: '//evil' })).toThrow()
    expect(() =>
      validateConfig({ ...config, fields: [...config.fields, ...config.fields] }),
    ).toThrow()
    expect(() =>
      validateConfig({ ...config, fields: [{ key: '__proto__', label: 'bad', type: 'text' }] }),
    ).toThrow()
  })
  it('generates compilable SFC and safely encoded config', () => {
    const files = generateFiles({ ...config, title: '商品 </script> " 测试' })
    const page = files['src/modules/generated/products/index.vue']
    const { descriptor, errors } = parse(page)
    expect(errors).toEqual([])
    expect(() => compileScript(descriptor, { id: 'test' })).not.toThrow()
    expect(
      compileTemplate({ source: descriptor.template!.content, filename: 'index.vue', id: 'test' })
        .errors,
    ).toEqual([])
    expect(files['src/modules/generated/products/schema.ts']).not.toContain('</script>')
  })
  it('writes outputs and refuses collisions before any write', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'admin-gen-'))
    await writeFiles(root, { 'a/file.ts': 'one' })
    await expect(writeFiles(root, { 'b/new.ts': 'new', 'a/file.ts': 'two' })).rejects.toThrow()
    expect(await readFile(path.join(root, 'a/file.ts'), 'utf8')).toBe('one')
    await expect(readFile(path.join(root, 'b/new.ts'))).rejects.toThrow()
  })
  it('rejects escaped targets and symlink parents', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'admin-safe-'))
    await expect(writeFiles(root, { '../escape': 'bad' })).rejects.toThrow()
    const outside = await mkdtemp(path.join(tmpdir(), 'admin-out-'))
    await symlink(outside, path.join(root, 'linked'), 'junction')
    await expect(writeFiles(root, { 'linked/file.ts': 'bad' })).rejects.toThrow()
  })
})
