// Generates `public/og-image.png` — the social/messaging preview card that
// iMessage, Twitter, Slack, etc. render when someone shares a Receipt link.
//
// Receipt encodes sessions in the URL hash (#d=…), which is never sent to
// the server and therefore invisible to OG crawlers. That means we can't
// render per-session previews from a static host — we ship a single branded
// card that looks intentional in every share.
//
// To regenerate after whitelabel changes:
//   node scripts/generate-og.mjs
//
// The script reads APP_NAME / APP_TAGLINE from `src/lib/branding.ts` so
// the OG card stays in sync with the rest of the brand.

import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = join(__dirname, '..')

const brandingSrc = readFileSync(join(REPO, 'src/lib/branding.ts'), 'utf-8')
const pick = (key) => brandingSrc.match(new RegExp(`export const ${key} = '([^']+)'`))?.[1]

const APP_NAME = pick('APP_NAME')
const APP_TAGLINE = pick('APP_TAGLINE')
if (!APP_NAME || !APP_TAGLINE) {
  throw new Error('Could not parse APP_NAME / APP_TAGLINE from src/lib/branding.ts')
}

// Sample data on the receipt mockup. Names + amounts are intentionally generic
// "looks-like-a-real-split" content — never anyone's real session data.
const SAMPLE = {
  title: 'Lisbon Trip',
  date: 'MAY 24, 2026',
  serial: '№ 20260524-OK2A',
  total: '$1,069.00',
  people: 3,
  expenses: 4,
  settles: [
    ['Sam', 'Alex', '$84.20'],
    ['Jordan', 'Alex', '$57.60'],
  ],
}

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap"
    />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --paper: #f5ecd9;
        --ink: #2a1f17;
        --muted: #7a6a5a;
        --rule: #b8a890;
        --accent: oklch(58% 0.18 28);
      }
      html, body { width: 1200px; height: 630px; overflow: hidden; }
      body {
        background: var(--paper);
        font-family: 'Inter', system-ui, sans-serif;
        color: var(--ink);
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        gap: 64px;
        padding: 56px 72px;
        /* subtle warm vignette so the cream feels like paper, not flat color */
        background-image: radial-gradient(
          ellipse at top left,
          rgba(255, 240, 210, 0.6),
          transparent 60%
        );
      }

      /* Left: brand */
      .brand { display: flex; flex-direction: column; gap: 28px; }
      .wordmark {
        display: inline-flex;
        align-items: baseline;
        gap: 14px;
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-weight: 500;
        font-size: 128px;
        line-height: 1;
        letter-spacing: -0.02em;
      }
      .barcode {
        display: inline-flex;
        align-items: flex-end;
        gap: 3px;
        transform: translateY(-12px);
      }
      .barcode span {
        display: block;
        background: var(--accent);
      }
      .b1 { width: 4px; height: 36px; }
      .b2 { width: 2px; height: 52px; opacity: 0.85; }
      .b3 { width: 4px; height: 26px; opacity: 0.65; }
      .b4 { width: 2px; height: 44px; opacity: 0.92; }

      .tagline {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-weight: 500;
        font-size: 44px;
        line-height: 1.15;
        color: var(--ink);
        max-width: 12ch;
      }
      .url {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 16px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--muted);
      }

      /* Right: receipt card mockup, tilted */
      .receipt {
        background: var(--paper);
        padding: 36px 32px;
        border-radius: 6px;
        box-shadow:
          0 1px 0 rgba(0, 0, 0, 0.04),
          0 24px 60px -20px rgba(60, 40, 20, 0.35),
          0 8px 18px -8px rgba(60, 40, 20, 0.2);
        transform: rotate(-3deg);
        font-size: 14px;
        line-height: 1.5;
        position: relative;
      }
      /* Slight notch at the bottom edge for "torn receipt" hint */
      .receipt::after {
        content: "";
        position: absolute;
        left: 0; right: 0; bottom: -8px;
        height: 14px;
        background-image:
          radial-gradient(circle at 8px 0, transparent 6px, var(--paper) 6px);
        background-size: 16px 14px;
        background-repeat: repeat-x;
        mask-image: linear-gradient(to bottom, black 0, black 50%, transparent 50%);
      }
      .receipt .head {
        text-align: center;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .receipt .title {
        margin-top: 6px;
        text-align: center;
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-weight: 500;
        font-size: 36px;
        line-height: 1.1;
        color: var(--ink);
      }
      .receipt .serial {
        margin-top: 6px;
        text-align: center;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .rule {
        border: 0;
        border-top: 1px dashed var(--rule);
        margin: 18px 0;
      }
      .receipt .total-label {
        text-align: center;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .receipt .total {
        margin-top: 4px;
        text-align: center;
        font-family: 'Fraunces', Georgia, serif;
        font-weight: 600;
        font-size: 60px;
        line-height: 1.05;
        font-variant-numeric: tabular-nums;
        color: var(--ink);
      }
      .receipt .total-sub {
        margin-top: 6px;
        text-align: center;
        font-size: 13px;
        color: var(--muted);
      }
      .receipt .settle-head {
        text-align: center;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .settle {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
      }
      .settle-row {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: 14px;
      }
      .settle-row .name { font-weight: 500; }
      .settle-row .arrow {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        color: var(--muted);
      }
      .leaders {
        flex: 1;
        height: 1em;
        background-image: radial-gradient(circle at center, var(--rule) 0.7px, transparent 0.7px);
        background-size: 6px 6px;
        background-repeat: repeat-x;
        background-position: left center;
      }
      .amt {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        font-size: 14px;
      }
      .footer {
        margin-top: 18px;
        text-align: center;
      }
      .footer .thanks {
        font-family: 'Fraunces', Georgia, serif;
        font-style: italic;
        font-weight: 500;
        font-size: 14px;
        color: var(--ink);
      }
      .footer .signature {
        margin-top: 6px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 9px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <div class="brand">
      <div class="wordmark">
        <span>${APP_NAME}.</span>
        <span class="barcode" aria-hidden="true">
          <span class="b1"></span>
          <span class="b2"></span>
          <span class="b3"></span>
          <span class="b4"></span>
        </span>
      </div>
      <p class="tagline">${APP_TAGLINE}.</p>
      <p class="url">no account · share via url</p>
    </div>

    <div class="receipt">
      <p class="head">The split · ${SAMPLE.date}</p>
      <h2 class="title">${SAMPLE.title}</h2>
      <p class="serial">${SAMPLE.serial}</p>
      <hr class="rule" />
      <p class="total-label">Grand Total</p>
      <p class="total">${SAMPLE.total}</p>
      <p class="total-sub">across ${SAMPLE.people} people · ${SAMPLE.expenses} expenses</p>
      <hr class="rule" />
      <p class="settle-head">— Settle Up —</p>
      <div class="settle">
        ${SAMPLE.settles
          .map(
            ([from, to, amount]) => `
          <div class="settle-row">
            <span class="name">${from}</span>
            <span class="arrow">→</span>
            <span class="name">${to}</span>
            <span class="leaders" aria-hidden="true"></span>
            <span class="amt">${amount}</span>
          </div>`
          )
          .join('')}
      </div>
      <hr class="rule" />
      <div class="footer">
        <p class="thanks">thanks, come again</p>
        <p class="signature">split with ${APP_NAME}</p>
      </div>
    </div>
  </body>
</html>`

async function main() {
  mkdirSync(join(REPO, 'public'), { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.setContent(HTML, { waitUntil: 'networkidle' })
  // Belt-and-braces: wait for Google Fonts to actually load
  await page.evaluate(() => document.fonts.ready)
  const out = join(REPO, 'public/og-image.png')
  await page.screenshot({
    path: out,
    type: 'png',
    omitBackground: false,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  })
  await browser.close()
  console.log(`Wrote ${out}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
