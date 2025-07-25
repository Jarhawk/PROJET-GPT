// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from "react";
import {
  Dialog as RadixDialog,
  DialogContent as RadixDialogContent,
  DialogOverlay as RadixDialogOverlay,
  DialogTitle as RadixDialogTitle,
  DialogDescription as RadixDialogDescription,
  DialogClose as RadixDialogClose,
} from "@radix-ui/react-dialog";

export function Dialog(props) {
  return <RadixDialog {...props} />;
}

export function DialogOverlay({ asChild = false, ...props }) {
  return <RadixDialogOverlay asChild={asChild} {...props} />;
}

export function DialogContent({ asChild = false, className = "", ...props }) {
  return (
    <RadixDialogContent
      asChild={asChild}
      className={`animate-fade-in-down ${className}`}
      {...props}
    />
  );
}

export function DialogTitle(props) {
  return <RadixDialogTitle {...props} />;
}

export function DialogDescription(props) {
  return <RadixDialogDescription {...props} />;
}

export function DialogClose(props) {
  return <RadixDialogClose {...props} />;
}

export function DialogHeader({ children, className = "", ...props }) {
  return (
    <div className={`p-4 border-b relative ${className}`} {...props}>
      {children}
    </div>
  );
}
