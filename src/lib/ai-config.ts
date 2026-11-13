import { validateConfig, type GeneratorConfig } from '../generator/core.mjs'

export function extractConfig(text: string): { config: GeneratorConfig } | { error: string } {
  const start = text.indexOf('{')
  if (start < 0) return { error: '回复中没有找到 JSON 配置' }
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const char = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') depth++
    else if (char === '}' && --depth === 0) {
      const slice = text.slice(start, i + 1)
      let parsed: unknown
      try {
        parsed = JSON.parse(slice)
      } catch (e) {
        return { error: 'JSON 无法解析：' + (e as Error).message }
      }
      try {
        return { config: validateConfig(parsed) as GeneratorConfig }
      } catch (e) {
        const issues = (e as { issues?: { path: (string | number)[]; message: string }[] }).issues
        return {
          error: issues
            ? issues.map((issue) => issue.path.join('.') + '：' + issue.message).join('；')
            : (e as Error).message,
        }
      }
    }
  }
  return { error: '回复中的 JSON 不完整' }
}

export function retryMessage(error: string): string {
  return `上次输出校验失败：${error}。请只输出修正后的完整 JSON，不要解释。`
}

export function buildPrompt(dictTypes: string[]): { role: 'system'; content: string } {
  return {
    role: 'system',
    content: [
      '你是管理后台的模块配置生成器。根据用户描述，只输出一个 JSON 对象，不要解释，不要使用代码块。',
      '格式：{"key":"suppliers","title":"供应商","description":"管理供应商","route":"/business/suppliers","fields":[{"key":"name","label":"名称","type":"text","required":true,"list":true,"search":true}]}',
      'key 为小写字母开头的字母数字，route 为 /business/ 加小写连字符。',
      'type 只能是 text、number、select、boolean、date、textarea。select 字段必须有不重复的 options。',
      '可用的字典类型：' + (dictTypes.length ? dictTypes.join('、') : '无') + '。select 字段可设 dictType 引用其中一个。',
    ].join('\n'),
  }
}
