// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion as Motion } from "framer-motion";

export default function SmartDialog({ open, onClose, title, description, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose?.()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <Motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
              />
            </Dialog.Overlay>
            <Motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Dialog.Content className="relative bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-xl p-6 w-full max-w-lg">
                {title && (
                  <Dialog.Title className="text-lg font-semibold mb-4">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="sr-only">
                    {description}
                  </Dialog.Description>
                )}
                <Dialog.Close asChild onClick={onClose}>
                  <button
                    className="absolute top-3 right-3 text-mamastockGold hover:text-mamastockGold/80"
                    aria-label="Fermer"
                    type="button"
                  >
                    ×
                  </button>
                </Dialog.Close>
                {children}
              </Dialog.Content>
            </Motion.div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
