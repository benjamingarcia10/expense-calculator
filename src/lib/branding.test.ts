/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { APP_NAME } from './branding'

// Walk all source files (and the root index.html) and ensure the brand name
// — APP_NAME — appears only inside this branding module. A whitelabel change
// must be possible by editing `branding.ts` alone.
//
// What counts as a hit: the brand name as a standalone *word* in a non-import
// line. That intentionally allows things like:
//   - `import { Receipt } from 'lucide-react'`  (icon identifier, not brand)
//   - `// ties to the receipt motif`             (lowercase metaphor in comments)
//   - CSS classes like `.receipt-card`           (lowercase, internal naming)

// Vitest runs from the repo root (`process.cwd()` is the repo). The walk is
// rooted at `src/` and also checks the top-level `index.html`.
const REPO = process.cwd()
const SRC = join(REPO, 'src')
const LIB = join(SRC, 'lib')
const INDEX_HTML = join(REPO, 'index.html')

const ALLOWED = new Set([join(LIB, 'branding.ts'), join(LIB, 'branding.test.ts')])

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(p, out)
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(p)
    }
  }
  return out
}

// Match the brand name as a word (not as part of `ReceiptIcon` etc.).
const WORD_BOUNDARY = new RegExp(`(^|[^A-Za-z0-9_])${APP_NAME}([^A-Za-z0-9_]|$)`)

describe('brand isolation', () => {
  it(`does not hardcode '${APP_NAME}' outside src/lib/branding.ts`, () => {
    const files = walk(SRC).filter((f) => !ALLOWED.has(f))
    files.push(INDEX_HTML)

    const offenders: { file: string; line: number; text: string }[] = []

    for (const f of files) {
      const lines = readFileSync(f, 'utf-8').split('\n')
      lines.forEach((line: string, i: number) => {
        // Imports bring in identifiers like the lucide-react `Receipt` icon —
        // that's code, not a brand-display reference.
        if (/^\s*import\b/.test(line)) return
        if (WORD_BOUNDARY.test(line)) {
          offenders.push({ file: relative(REPO, f), line: i + 1, text: line.trim() })
        }
      })
    }

    if (offenders.length > 0) {
      const list = offenders.map((o) => `  ${o.file}:${o.line}  ${o.text}`).join('\n')
      throw new Error(
        `Hardcoded brand name "${APP_NAME}" found. Use APP_NAME / APP_FULL_TITLE ` +
          `from \`src${sep}lib${sep}branding.ts\` instead.\n${list}`
      )
    }
    expect(offenders).toHaveLength(0)
  })
})
