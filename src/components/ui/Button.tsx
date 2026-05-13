import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white shadow-sm hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
  ghost:
    'bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-border)]/60 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color] duration-150 ease-out ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
