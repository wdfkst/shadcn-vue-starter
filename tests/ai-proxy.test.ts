import { afterEach, describe, expect, it, vi } from 'vitest'
import { handleAiChat } from '../dev/ai-proxy.mjs'

function request(body: unknown, address = '127.0.0.1') {
  return {
    socket: { remoteAddress: address },
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))
    },
  }
}

function response() {
  const res = {
    statusCode: 0,
    body: '',
    writeHead(status: number) {
      this.statusCode = status
    },
    end(data: string) {
      this.body = data
    },
  }
  return res
}

const env = { AI_BASE_URL: 'https://ai.example/v1', AI_MODEL: 'test-model', AI_API_KEY: 'secret' }

afterEach(() => vi.useRealTimers())

describe('ai proxy', () => {
  it('rejects requests that are not from localhost', async () => {
    const res = response()
    await handleAiChat(request({ messages: [] }, '10.0.0.8'), res, env, vi.fn())
    expect(res.statusCode).toBe(403)
  })

  it('reports a missing API key', async () => {
    const res = response()
    await handleAiChat(request({ messages: [] }), res, { ...env, AI_API_KEY: '' }, vi.fn())
    expect(res.statusCode).toBe(503)
    expect(res.body).toContain('未配置')
  })

  it('rejects a body over 100KB', async () => {
    const res = response()
    await handleAiChat(request({ messages: [{ role: 'user', content: 'x'.repeat(110_000) }] }), res, env, vi.fn())
    expect(res.statusCode).toBe(413)
  })

  it('forwards the chat request and returns the content', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"key":"a"}' } }] }),
    }))
    const res = response()
    const messages = [{ role: 'user', content: '做一个供应商模块' }]
    await handleAiChat(request({ messages }), res, env, fetchImpl)
    expect(fetchImpl).toHaveBeenCalledOnce()
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(url).toBe('https://ai.example/v1/chat/completions')
    expect(JSON.parse(init.body)).toMatchObject({ model: 'test-model', messages })
    expect(init.headers.Authorization).toBe('Bearer secret')
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ content: '{"key":"a"}' })
  })

  it('aborts the upstream request after 60 seconds', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn((_url: string, init: { signal: AbortSignal }) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))
    }))
    const pending = handleAiChat(request({ messages: [] }), response(), env, fetchImpl)
    await vi.advanceTimersByTimeAsync(60_000)
    await pending
    expect(fetchImpl.mock.calls[0]![1].signal.aborted).toBe(true)
  })
})
