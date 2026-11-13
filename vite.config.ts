import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { aiProxyPlugin } from './dev/ai-proxy.mjs'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix loads AI_* too; they reach only the dev middleware, never import.meta.env.
  const env = loadEnv(mode, dirname, '')
  return {
    plugins: [
      vue(),
      tailwindcss(),
      aiProxyPlugin({
        env: {
          AI_BASE_URL: env.AI_BASE_URL ?? '',
          AI_MODEL: env.AI_MODEL ?? '',
          AI_API_KEY: env.AI_API_KEY ?? '',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(dirname, './src'),
      },
    },
    server: {
      port: 5175,
      host: true,
    },
  }
})
