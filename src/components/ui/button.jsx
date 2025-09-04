/* @ts-nocheck */
import React from 'react';

/** Bouton minimal compatible (shadcn-like) */
export function Button({ asChild = false, className = '', ...props }) {
  const Comp = asChild ? 'span' : 'button';
  return <Comp className={className} {...props} />;
}

/** Compat: certains fichiers font `import Button from ...` */
export default Button;
