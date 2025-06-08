diff --git a//dev/null b/src/components/ui/dialog.jsx
index 0000000000000000000000000000000000000000..4843b9c33bc9058899ae4a25f7976d53d8bc281a 100644
--- a//dev/null
+++ b/src/components/ui/dialog.jsx
@@ -0,0 +1,45 @@
+import React from 'react';
+import {
+  Dialog as RadixDialog,
+  DialogContent as RadixDialogContent,
+  DialogOverlay as RadixDialogOverlay,
+  DialogTitle as RadixDialogTitle,
+  DialogClose as RadixDialogClose,
+  DialogPortal,
+} from '@radix-ui/react-dialog';
+
+export function Dialog(props) {
+  return <RadixDialog {...props} />;
+}
+
+export function DialogOverlay({ asChild = false, ...props }) {
+  return (
+    <DialogPortal>
+      <RadixDialogOverlay asChild={asChild} {...props} />
+    </DialogPortal>
+  );
+}
+
+export function DialogContent({ asChild = false, ...props }) {
+  return (
+    <DialogPortal>
+      <RadixDialogContent asChild={asChild} {...props} />
+    </DialogPortal>
+  );
+}
+
+export function DialogTitle(props) {
+  return <RadixDialogTitle {...props} />;
+}
+
+export function DialogClose(props) {
+  return <RadixDialogClose {...props} />;
+}
+
+export function DialogHeader({ children, className = '', ...props }) {
+  return (
+    <div className={`p-4 border-b relative ${className}`} {...props}>
+      {children}
+    </div>
+  );
+}
