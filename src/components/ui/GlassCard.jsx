import React from 'react';

export default function GlassCard({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-glass border border-borderGlass backdrop-blur rounded-xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
