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
      className={`w-full bg-white/10 text-white p-2 rounded-md border border-white/20 ring-1 ring-white/20 backdrop-blur focus:outline-none hover:bg-white/10 transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
