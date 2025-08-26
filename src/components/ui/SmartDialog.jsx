import { useEffect } from 'react';
import {
  Root as Dialog,
  Overlay as DialogOverlay,
  Content as RadixDialogContent,
  Title as DialogTitle,
  Description as RadixDialogDescription,
  Close as DialogClose,
} from '@radix-ui/react-dialog'

export {
  Dialog,
  DialogOverlay,
  DialogTitle,
  RadixDialogDescription as DialogDescription,
  DialogClose,
  DialogContent,
}

export function DialogContent({ 'aria-describedby': ariaDescribedBy, children, ...props }) {
  const id = ariaDescribedBy || 'dialog-desc'
  return (
    <RadixDialogContent aria-describedby={id} {...props}>
      {children}
      {!ariaDescribedBy && (
        <RadixDialogDescription id={id} className="sr-only" />
      )}
    </RadixDialogContent>
  )
}

export default Dialog

/** Bloque le scroll de fond quand le Dialog est ouvert */
export function useLockBodyScroll(open) {
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    if (open) document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);
}
