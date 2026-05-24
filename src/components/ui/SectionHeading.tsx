import type { ReactNode } from 'react'

/**
 * Editorial section heading used inside each bento panel.
 * Pairs Fraunces italic display text with an optional mono count tag and a
 * dashed under-rule that ties to the receipt aesthetic.
 */
export function SectionHeading({
  title,
  count,
  action,
}: {
  title: string
  count?: number | string
  action?: ReactNode
}) {
  return (
    // items-center balances the row when the action is a 44pt touch-target
    // button against a ~28px heading — the 16px overhang is split symmetrically
    // top/bottom rather than dropping it all above the heading like items-end
    // did. For small text-tag actions (e.g. Settle Up's "01 TX") centering
    // reads the same as baseline-aligning at heading scale.
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="h-display text-xl text-[var(--color-ink)] sm:text-2xl">{title}</h2>
        {count != null && <span className="tag">{String(count).padStart(2, '0')}</span>}
      </div>
      {action}
    </div>
  )
}
