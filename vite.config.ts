import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { APP_FULL_TITLE, APP_NAME, APP_TAGLINE } from './src/lib/branding'

// Substitute brand placeholders in index.html at build/dev time from the
// single source of truth in `src/lib/branding.ts`. Whitelabel changes there
// flow through to `<title>`, og:title, and any other tagged spot in the HTML.
const BRAND_TOKENS: Record<string, string> = {
  '{{APP_NAME}}': APP_NAME,
  '{{APP_TAGLINE}}': APP_TAGLINE,
  '{{APP_FULL_TITLE}}': APP_FULL_TITLE,
}

export default defineConfig({
  base: '/expense-calculator/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'inject-brand',
      transformIndexHtml(html) {
        let out = html
        for (const [token, value] of Object.entries(BRAND_TOKENS)) {
          out = out.split(token).join(value)
        }
        return out
      },
    },
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    exclude: ['node_modules', 'dist', 'tests/e2e/**'],
  },
})
