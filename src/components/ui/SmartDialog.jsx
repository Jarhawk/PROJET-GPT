import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'

export const DialogRoot = Dialog.Root
export const DialogTrigger = Dialog.Trigger
export const DialogPortal = Dialog.Portal
export const DialogTitle = Dialog.Title
export const DialogDescription = Dialog.Description
export const DialogClose = Dialog.Close

export const DialogOverlay = React.forwardRef(function DialogOverlay(props, ref) {
  return (
    <Dialog.Overlay
      ref={ref}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      {...props}
    />
  )
})

/** ⚠️ Changement clé : wrapper flex centré sur tout l’écran. */
export const DialogContent = React.forwardRef(function DialogContent(
  { className = '', children, ...props },
  ref
) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <Dialog.Content
          ref={ref}
          className={
            "w-[min(92vw,900px)] max-h-[85vh] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl outline-none " +
            "data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 " +
            "data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0 " +
            "focus:outline-none " +
            className
          }
          {...props}
        >
          {children}
        </Dialog.Content>
      </div>
    </DialogPortal>
  )
})

/** Bloque le scroll de fond quand le Dialog est ouvert */
export function useLockBodyScroll(open) {
  React.useEffect(() => {
    const prev = document.documentElement.style.overflow
    if (open) document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [open])
}

const SmartDialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
}
export default SmartDialog

