import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-[#0D2240] text-white hover:bg-[#1A3A6B]': variant === 'primary',
          'bg-[#E6A817] text-[#0D2240] hover:bg-[#F5C842]': variant === 'secondary',
          'bg-transparent text-[#0D2240] hover:bg-gray-100': variant === 'ghost',
          'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg w-full': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  )
}
