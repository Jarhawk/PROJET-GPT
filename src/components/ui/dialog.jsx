import React from "react";
import {
  Dialog as RadixDialog,
  DialogContent as RadixDialogContent,
  DialogOverlay as RadixDialogOverlay,
  DialogTitle as RadixDialogTitle,
  DialogClose as RadixDialogClose,
} from "@radix-ui/react-dialog";

export function Dialog(props) {
  return <RadixDialog {...props} />;
}

export function DialogOverlay({ asChild = false, ...props }) {
  return <RadixDialogOverlay asChild={asChild} {...props} />;
}

export function DialogContent({ asChild = false, ...props }) {
  return <RadixDialogContent asChild={asChild} {...props} />;
}

export function DialogTitle(props) {
  return <RadixDialogTitle {...props} />;
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
