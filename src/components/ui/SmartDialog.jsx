import { useEffect } from 'react';
import {
  Root as Dialog,
  Overlay as DialogOverlay,
  Content as DialogContent,
  Title as DialogTitle,
  Description as DialogDescription,
  Close as DialogClose,
} from '@radix-ui/react-dialog'

export { Dialog, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose }

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
