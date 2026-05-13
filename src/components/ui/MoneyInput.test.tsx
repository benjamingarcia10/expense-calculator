import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MoneyInput } from './MoneyInput'
import type { CurrencyCode } from '../../lib/currencies'

function Controlled({ currency = 'USD' as CurrencyCode, onChange }: { currency?: CurrencyCode; onChange?: (v: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <MoneyInput
      aria-label="amount"
      currency={currency}
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange?.(v)
      }}
    />
  )
}

describe('MoneyInput format-on-blur', () => {
  it('formats integer to two decimals on blur for USD', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    const input = screen.getByLabelText('amount') as HTMLInputElement
    await user.type(input, '12')
    expect(input.value).toBe('12')
    await user.tab()
    expect(input.value).toBe('12.00')
    expect(onChange).toHaveBeenLastCalledWith('12.00')
  })

  it('pads short decimal to two places (12.5 → 12.50)', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    const input = screen.getByLabelText('amount') as HTMLInputElement
    await user.type(input, '12.5')
    await user.tab()
    expect(input.value).toBe('12.50')
  })

  it('leaves empty input empty on blur', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    const input = screen.getByLabelText('amount') as HTMLInputElement
    await user.click(input)
    await user.tab()
    expect(input.value).toBe('')
  })

  it('does not add decimals for JPY (0-decimal currency)', async () => {
    const user = userEvent.setup()
    render(<Controlled currency="JPY" />)
    const input = screen.getByLabelText('amount') as HTMLInputElement
    await user.type(input, '500')
    await user.tab()
    expect(input.value).toBe('500')
  })

  it('blocks decimal point for JPY', async () => {
    const user = userEvent.setup()
    render(<Controlled currency="JPY" />)
    const input = screen.getByLabelText('amount') as HTMLInputElement
    await user.type(input, '5.5')
    // The "." is blocked at keydown, but if it slips through paste, sanitize strips it.
    // After typing, value should not contain a dot.
    expect(input.value).not.toContain('.')
  })
})
