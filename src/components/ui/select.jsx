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
      className={`w-full px-4 py-2 bg-white/70 text-black rounded-xl shadow-sm border border-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-mamastockGold ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
