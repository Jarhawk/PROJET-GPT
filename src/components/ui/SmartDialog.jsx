// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useId } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion as Motion } from "framer-motion";

// Si tu exposes des wrappers, garde-les. Sinon, expose au minimum ceci :
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogOverlay = DialogPrimitive.Overlay;
export const DialogContent = DialogPrimitive.Content;
export const DialogTitle = DialogPrimitive.Title;
export const DialogClose = DialogPrimitive.Close;
// 👇 AJOUT : règle le warning "Missing Description"
export const DialogDescription = DialogPrimitive.Description;

export default function SmartDialog({ open, onClose, title, description, children }) {
  const descriptionId = useId();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose?.()}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <Motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
              />
            </DialogPrimitive.Overlay>
            <Motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <DialogPrimitive.Content
                aria-describedby={descriptionId}
                className="relative bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-xl p-6 w-full max-w-lg"
              >
                {title && (
                  <DialogPrimitive.Title className="text-lg font-semibold mb-4">
                    {title}
                  </DialogPrimitive.Title>
                )}
                <DialogPrimitive.Description id={descriptionId} className="sr-only">
                  {description || ""}
                </DialogPrimitive.Description>
                <DialogPrimitive.Close asChild onClick={onClose}>
                  <button
                    className="absolute top-3 right-3 text-mamastockGold hover:text-mamastockGold/80"
                    aria-label="Fermer"
                    type="button"
                  >
                    ×
                  </button>
                </DialogPrimitive.Close>
                {children}
              </DialogPrimitive.Content>
            </Motion.div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
