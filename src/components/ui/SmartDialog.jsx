import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export const Root = DialogPrimitive.Root;
export const Title = DialogPrimitive.Title;
export const Description = DialogPrimitive.Description;
export const Close = DialogPrimitive.Close;

const Overlay = React.forwardRef(function Overlay(props, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      {...props}
    />
  );
});

export const Content = React.forwardRef(function Content(
  { className = '', children, ...props },
  ref
) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <DialogPrimitive.Content
          ref={ref}
          className={
            'w-[min(92vw,900px)] max-h-[85vh] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl outline-none ' +
            'data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 ' +
            'data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0 ' +
            className
          }
          {...props}
        >
          {children}
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  );
});

// Maintient la mise en page lors du blocage du scroll
export function useLockBodyScroll(open) {
  React.useEffect(() => {
    const el = document.documentElement;
    const prevOverflow = el.style.overflow;
    const prevPadding = el.style.paddingRight;
    if (open) {
      const scrollbar = window.innerWidth - el.clientWidth;
      if (scrollbar > 0) el.style.paddingRight = `${scrollbar}px`;
      el.style.overflow = 'hidden';
    }
    return () => {
      el.style.overflow = prevOverflow;
      el.style.paddingRight = prevPadding;
    };
  }, [open]);
}

export default Root;
