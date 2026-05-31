/**
 * Local entry identifier — used by the switcher and manage sheet to address
 * library entries. Never leaves the device and never appears in URLs.
 * Format: `s_<8 base36 chars>` to match the existing `newId()` style in the
 * session store.
 */
export function newEntryId(): string {
  return 's_' + Math.random().toString(36).slice(2, 10).padEnd(8, '0')
}

/**
 * Cross-device lineage marker for a session. Generated on first share, or
 * adopted from an incoming share URL on first import. Stable for the life of
 * the entry. UUID v4 from `crypto.randomUUID()` — available in all targets
 * under a secure context (localhost dev + production HTTPS satisfy this).
 */
export function newSessionId(): string {
  return crypto.randomUUID()
}
