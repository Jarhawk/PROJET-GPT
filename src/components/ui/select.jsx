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
      className={`w-full p-2 border border-white/30 rounded-md bg-white/10 dark:bg-[#202638]/50 backdrop-blur text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mamastockGold ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
