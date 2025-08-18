import * as DialogPrimitive from '@radix-ui/react-dialog'

const cx = (...xs) => xs.filter(Boolean).join(' ')

// Sous-composants Radix exposés
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close
const DialogTitle = DialogPrimitive.Title
const DialogDescription = DialogPrimitive.Description

export function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      // z-index élevé pour passer devant tout
      className={cx(
        'fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        className
      )}
      {...props}
    />
  )
}

export function DialogContent({ className, children, ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        // z-index > overlay, largeur limitée, fond adapté clair/sombre, bordure/ombre
        className={cx(
          'fixed left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2',
          'w-[min(96vw,900px)] max-h-[82vh] overflow-hidden',
          'rounded-2xl border border-black/10 dark:border-white/10',
          'bg-white text-slate-900 dark:bg-neutral-900 dark:text-slate-100',
          'shadow-2xl outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          className
        )}
        {...props}
      >
        {/* Contenu scrollable interne pour éviter les débordements */}
        <div className="flex max-h-[82vh] flex-col">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

// Composant racine pratique
function SmartDialog({ open, onClose, title, description, children, ...props }) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()} {...props}>
      <DialogContent>
        {title && <DialogTitle>{title}</DialogTitle>}
        {description && <DialogDescription>{description}</DialogDescription>}
        {children}
      </DialogContent>
    </Dialog>
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogContent,
}

export default SmartDialog

