const MAX_BODY = 100_000
const TIMEOUT_MS = 60_000

export function aiProxyPlugin(options = {}) {
  return {
    name: 'ai-proxy',
    configureServer(server) {
      server.middlewares.use('/__ai/chat', (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end()
          return
        }
        handleAiChat(req, res, { ...process.env, ...options.env }, options.fetchImpl)
      })
    },
  }
}
export async function handleAiChat(req, res, env, fetchImpl = fetch) {
  const address = req.socket?.remoteAddress ?? ''
  if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') {
    res.writeHead(403)
    res.end(JSON.stringify({ error: '只允许本机访问' }))
    return
  }
  if (!env.AI_API_KEY) {
    res.writeHead(503)
    res.end(JSON.stringify({ error: '未配置 AI_API_KEY' }))
    return
  }

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (raw.length > MAX_BODY) {
    res.writeHead(413)
    res.end(JSON.stringify({ error: '请求过大' }))
    return
  }

  let messages
  try {
    messages = JSON.parse(raw).messages
  } catch {
    res.writeHead(400)
    res.end(JSON.stringify({ error: '请求格式错误' }))
    return
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const upstream = await fetchImpl(env.AI_BASE_URL.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + env.AI_API_KEY,
      },
      body: JSON.stringify({ model: env.AI_MODEL, messages }),
    })
    if (!upstream.ok) {
      res.writeHead(502)
      res.end(JSON.stringify({ error: 'AI 服务返回 ' + upstream.status }))
      return
    }
    const data = await upstream.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      res.writeHead(502)
      res.end(JSON.stringify({ error: 'AI 回复格式异常' }))
      return
    }
    res.writeHead(200)
    res.end(JSON.stringify({ content }))
  } catch (e) {
    res.writeHead(e?.name === 'AbortError' ? 504 : 502)
    res.end(JSON.stringify({ error: e?.name === 'AbortError' ? 'AI 服务超时' : '无法连接 AI 服务' }))
  } finally {
    clearTimeout(timer)
  }
}
