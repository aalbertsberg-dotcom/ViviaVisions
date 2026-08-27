import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

type PlatformConfig = { name: string; description: string }
const platformConfig = JSON.parse(readFileSync(fileURLToPath(new URL('./platform.config.json', import.meta.url)), 'utf8')) as PlatformConfig

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'platform-brand-html',
      transformIndexHtml(html) {
        return html
          .replaceAll('__APP_NAME__', platformConfig.name)
          .replaceAll('__APP_DESCRIPTION__', platformConfig.description)
      },
    },
  ],
  base: './',
})
