// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from 'react';

export function GlassCard({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-glass border border-borderGlass backdrop-blur rounded-xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard;
