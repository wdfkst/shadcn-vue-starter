import { describe, expect, it } from 'vitest'
import { buildPrompt, extractConfig, retryMessage } from '../src/lib/ai-config'

const json = JSON.stringify({
  key: 'suppliers',
  title: '供应商',
  route: '/business/suppliers',
  fields: [{ key: 'name', label: '名称', type: 'text', required: true, list: true, search: false }],
})

describe('ai config extraction', () => {
  it('reads plain JSON', () => {
    const result = extractConfig(json)
    expect('config' in result && result.config.key).toBe('suppliers')
  })

  it('reads JSON wrapped in a code fence', () => {
    const result = extractConfig('```json\n' + json + '\n```')
    expect('config' in result && result.config.title).toBe('供应商')
  })

  it('reads JSON surrounded by explanation', () => {
    const result = extractConfig('好的，配置如下：\n' + json + '\n希望有帮助。')
    expect('config' in result && result.config.route).toBe('/business/suppliers')
  })

  it('reports invalid JSON', () => {
    const result = extractConfig('这里没有配置')
    expect('error' in result && result.error.length > 0).toBe(true)
  })

  it('reports schema failures with the zod message', () => {
    const result = extractConfig(JSON.stringify({ key: 'suppliers' }))
    expect('error' in result && result.error).toContain('route')
  })

  it('builds the retry message from the error', () => {
    expect(retryMessage('route：必填')).toContain('route：必填')
  })

  it('lists the available dictionary types in the prompt', () => {
    const prompt = buildPrompt(['sys_status', 'sys_role'])
    expect(prompt.role).toBe('system')
    expect(prompt.content).toContain('sys_status')
    expect(prompt.content).toContain('sys_role')
  })
})
