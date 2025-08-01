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
      className={`form-select ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
