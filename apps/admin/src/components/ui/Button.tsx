import { classNames } from '@/lib/format'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
}

export function buttonClassName(
  variant: 'primary' | 'secondary' = 'primary',
  className?: string,
) {
  return classNames(
    'inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
    variant === 'primary' && 'bg-vog-brown text-white hover:bg-vog-brown-soft',
    variant === 'secondary' &&
      'border border-vog-brown/20 bg-white text-vog-brown hover:border-vog-green hover:text-vog-pattern',
    className,
  )
}

export function Button({
  children,
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClassName(variant, className)} {...props}>
      {children}
    </button>
  )
}
