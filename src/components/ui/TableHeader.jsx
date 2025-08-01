// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from 'react';

export default function TableHeader({ children, className = '', ...props }) {
  return (
    <div className={`flex flex-wrap gap-4 items-end mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
