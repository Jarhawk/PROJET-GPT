import React, { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

/** Expose Radix primitives sous des noms stables */
const DialogRoot = Dialog.Root
const DialogTrigger = Dialog.Trigger
const DialogPortal = Dialog.Portal
const DialogTitle = Dialog.Title
const DialogDescription = Dialog.Description
const DialogClose = Dialog.Close

function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [locked])
}

/** Overlay stylé (déclaré une seule fois, exporté une seule fois) */
const DialogOverlay = React.forwardRef(function DialogOverlay(props, ref) {
  return (
    <Dialog.Overlay
      ref={ref}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      {...props}
    />
  )
})

/** Content centré, thème neutre pour ne pas “tout blanc sur blanc” */
const DialogContent = React.forwardRef(function DialogContent({ className = '', children, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <Dialog.Content
        ref={ref}
        className={
          "fixed left-1/2 top-1/2 w-[min(92vw,760px)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card text-card-foreground shadow-xl outline-none " +
          "p-4 sm:p-6 overflow-auto " + className
        }
        {...props}
      >
        {children}
      </Dialog.Content>
    </DialogPortal>
  )
})

/** Exports nommés (UNE seule fois chacun) */
export {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  useLockBodyScroll,
}

/** Export par défaut en “namespace” pour compat éventuelle */
const SmartDialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
  useLockBodyScroll,
}
export default SmartDialog
