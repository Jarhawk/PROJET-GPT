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
      className={`w-full bg-white/10 text-white p-2 rounded-xl border border-white/20 backdrop-blur-md shadow-sm focus:outline-none focus:ring hover:bg-white/20 transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
