import path from 'node:path'
import { lstat, mkdir, writeFile, unlink, realpath } from 'node:fs/promises'
async function exists(file) {
  try {
    return await lstat(file)
  } catch (e) {
    if (e.code === 'ENOENT') return null
    throw e
  }
}
export async function writeFiles(root, files) {
  root = await realpath(root)
  const outputs = []
  for (const [relative, content] of Object.entries(files)) {
    if (
      relative.includes('\\') ||
      path.isAbsolute(relative) ||
      relative.split('/').some((p) => !p || p === '.' || p === '..' || p.includes(':'))
    )
      throw Error(`不安全的路径: ${relative}`)
    const target = path.resolve(root, relative)
    if (!target.startsWith(root + path.sep)) throw Error('目标路径越界')
    let cursor = root
    for (const segment of relative.split('/')) {
      cursor = path.join(cursor, segment)
      const stat = await exists(cursor)
      if (stat?.isSymbolicLink()) throw Error(`拒绝符号链接: ${cursor}`)
      if (cursor === target && stat) throw Error(`文件已存在，未写入任何内容: ${relative}`)
      if (cursor !== target && stat && !stat.isDirectory()) throw Error('父路径不是目录')
    }
    outputs.push([target, content])
  }
  const written = []
  try {
    for (const [target, content] of outputs) {
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, content, { encoding: 'utf8', flag: 'wx' })
      written.push(target)
    }
  } catch (e) {
    for (const file of written) await unlink(file).catch(() => {})
    throw e
  }
  return written
}
