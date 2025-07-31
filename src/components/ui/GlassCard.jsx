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
export function GlassCard({
  title,
  children,
  footer,
  width = '',
  dark = false,
  className = '',
  ...props
}) {
  const colorClasses = dark
    ? 'bg-[#202638]/60 text-white'
    : 'bg-white/10 text-gray-900';
  return (
    <div
      className={`border border-white/30 backdrop-blur-md rounded-2xl shadow-lg p-6 ${colorClasses} ${width} ${className}`}
      {...props}
    >
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}

export default GlassCard;
