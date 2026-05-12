import { forwardRef, type InputHTMLAttributes } from 'react'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`h-10 w-full rounded-lg border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] outline-none transition-colors ${
          invalid ? 'border-red-500' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'
        } ${className}`}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
