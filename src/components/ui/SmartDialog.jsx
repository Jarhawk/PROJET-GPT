import React from "react";
import {
  Dialog as RadixDialog,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@radix-ui/react-dialog";
import { AnimatePresence, motion as Motion } from "framer-motion";

export default function SmartDialog({ open, onClose, title, children }) {
  return (
    <RadixDialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <AnimatePresence>
        {open && (
          <RadixDialogContent asChild forceMount>
            <>
              <RadixDialogOverlay asChild>
                <Motion.div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onClose}
                />
              </RadixDialogOverlay>
              <Motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="relative bg-glass border border-borderGlass backdrop-blur rounded-2xl shadow-xl p-6 w-full max-w-lg">
                  {title && (
                    <DialogTitle className="text-lg font-semibold mb-4">
                      {title}
                    </DialogTitle>
                  )}
                  <DialogClose
                    asChild
                    onClick={onClose}
                  >
                    <button
                      className="absolute top-3 right-3 text-mamastockGold hover:text-mamastockGold/80"
                      aria-label="Fermer"
                      type="button"
                    >
                      ×
                    </button>
                  </DialogClose>
                  {children}
                </div>
              </Motion.div>
            </>
          </RadixDialogContent>
        )}
      </AnimatePresence>
    </RadixDialog>
  );
}
