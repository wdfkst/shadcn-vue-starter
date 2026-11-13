export function handleAiChat(
  req: unknown,
  res: unknown,
  env: Record<string, string | undefined>,
  fetchImpl?: typeof fetch,
): Promise<void>
export function aiProxyPlugin(options?: {
  env?: Record<string, string>
  fetchImpl?: typeof fetch
}): { name: string }
