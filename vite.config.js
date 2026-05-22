import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Read .env files directly so values win over an empty/conflicting shell var.
// (Vite's loadEnv overlays process.env on top of file values, which breaks
//  when something in the shell exports ANTHROPIC_API_KEY="".)
function readEnvFile(filename) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), filename), 'utf-8')
    return Object.fromEntries(
      content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const idx = line.indexOf('=')
          if (idx === -1) return [line, '']
          return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
        }),
    )
  } catch {
    return {}
  }
}

export default defineConfig(({ mode }) => {
  const viteEnv = loadEnv(mode, process.cwd(), '')
  const fileEnv = { ...readEnvFile('.env'), ...readEnvFile('.env.local') }
  // File values take precedence over shell/process.env so empty exports
  // (e.g. from Claude CLI) don't shadow .env.local.
  const apiKey =
    fileEnv.ANTHROPIC_API_KEY ||
    fileEnv.VITE_ANTHROPIC_API_KEY ||
    viteEnv.ANTHROPIC_API_KEY ||
    viteEnv.VITE_ANTHROPIC_API_KEY

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (apiKey) {
                proxyReq.setHeader('x-api-key', apiKey)
                proxyReq.setHeader('anthropic-version', '2023-06-01')
                proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true')
              }
            })
          },
        },
      },
    },
  }
})
