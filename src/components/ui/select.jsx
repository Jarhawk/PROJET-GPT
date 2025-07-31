// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/ui/select.jsx

export function Select({
  value,
  onChange,
  children,
  className = "",
  ariaLabel,
  ...props
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      aria-label={ariaLabel || "Sélection"}
      className={`w-full px-4 py-2 bg-white/20 text-white placeholder-white/70 rounded-md border border-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
