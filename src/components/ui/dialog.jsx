import React from "react";
import {
  Dialog as RadixDialog,
  DialogContent as RadixDialogContent,
  DialogOverlay as RadixDialogOverlay,
  DialogTitle as RadixDialogTitle,
  DialogClose as RadixDialogClose,
} from "@radix-ui/react-dialog";

// Composant racine Dialog
export function Dialog(props) {
  return <RadixDialog {...props} />;
}

// Overlay du dialog (Radix gère le portal)
export function DialogOverlay({ asChild = false, ...props }) {
  return <RadixDialogOverlay asChild={asChild} {...props} />;
}

// Contenu du dialog (Radix gère le portal)
export function DialogContent({ asChild = false, ...props }) {
  return <RadixDialogContent asChild={asChild} {...props} />;
}

// Titre du dialog
export function DialogTitle(props) {
  return <RadixDialogTitle {...props} />;
}

// Bouton de fermeture du dialog
export function DialogClose(props) {
  return <RadixDialogClose {...props} />;
}

// Header custom pour le dialog
export function DialogHeader({ children, className = "", ...props }) {
  return (
    <div className={`p-4 border-b relative ${className}`} {...props}>
      {children}
    </div>
  );
}
