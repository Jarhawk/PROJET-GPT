/* @ts-nocheck */
import React from 'react';

/** Minimal button wrapper, compatible with previous usage. */
export function Button({ asChild = false, className = '', ...props }) {
  const Comp = asChild ? 'span' : 'button';
  return <Comp className={className} {...props} />;
}

/** Compat: allow `import Button from ...` */
export default Button;
