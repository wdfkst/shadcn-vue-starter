#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { generateFiles, validateConfig } from '../src/generator/core.mjs'
import { writeFiles } from './writer.mjs'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
try {
  const args = process.argv.slice(2)
  const i = args.indexOf('--config')
  if (i < 0 || !args[i + 1]) throw Error('用法: npm run gen -- --config /path/to/module.json')
  const input = path.resolve(args[i + 1])
  const config = validateConfig(JSON.parse(await readFile(input, 'utf8')))
  const dir = path.join(root, 'generator')
  let entries = []
  try {
    entries = await readdir(dir)
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
  for (const file of entries.filter((x) => x.endsWith('.json'))) {
    const previous = JSON.parse(await readFile(path.join(dir, file), 'utf8'))
    if (previous.route === config.route) throw Error(`路由已被占用: ${config.route}`)
  }
  const files = generateFiles(config)
  const outputConfig = path.join(root, `generator/${config.key}.json`)
  if (input === outputConfig) {
    delete files[`generator/${config.key}.json`]
  }
  const written = await writeFiles(root, files)
  console.log(
    `已生成 ${written.length} 个文件：\n${written.map((p) => path.relative(root, p)).join('\n')}\n路由自动注册：${config.route}\n运行 npm run build 验证生成结果。`,
  )
} catch (error) {
  console.error('生成失败：' + error.message)
  process.exitCode = 1
}
