import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

function cn(...cls) { return cls.filter(Boolean).join(' ') }

export const Button = React.forwardRef(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none h-9 px-3 py-2',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export default Button
