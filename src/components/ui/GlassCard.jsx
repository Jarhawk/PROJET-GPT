// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from 'react';

/**
 * Generic glass style card used across forms.
 *
 * @param {object} props
 * @param {string} [props.title] Optional header title
 * @param {React.ReactNode} props.children Card content
 * @param {React.ReactNode} [props.footer] Optional footer element
 * @param {string} [props.width] Tailwind max-width class (e.g. "max-w-lg")
 * @param {boolean} [props.dark] Force dark text/background
 * @param {string} [props.className] Additional classes
 */
export function GlassCard({ children, title, footer, className = '', width = 'w-full max-w-lg' }) {
  return (
    <div className={`relative ${width} rounded-2xl p-6 shadow-xl border border-white/20 bg-white/10 backdrop-blur-md text-white ${className}`}> 
      {title && <h2 className="text-xl font-semibold mb-4 text-white/90">{title}</h2>}
      <div className="space-y-4">{children}</div>
      {footer && <div className="mt-6">{footer}</div>}
    </div>
  );
}
export default GlassCard;
