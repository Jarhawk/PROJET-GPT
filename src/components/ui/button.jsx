import * as React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils'; // keep your local cn helper

const Button = React.forwardRef(function Button(
  { className, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn('inline-flex items-center justify-center', className)} {...props} />;
});

export { Button };
export default Button;
