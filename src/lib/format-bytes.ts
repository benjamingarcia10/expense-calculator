/**
 * Human-readable byte size — e.g. "1.2 MB". Used by the manage-library sheet's
 * usage indicator. Uses 1024-based (binary) units, formatted with one decimal
 * place that's dropped for whole numbers ("2 MB" instead of "2.0 MB").
 */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return formatNumber(n / 1024) + ' KB'
  return formatNumber(n / (1024 * 1024)) + ' MB'
}

function formatNumber(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1)
}
