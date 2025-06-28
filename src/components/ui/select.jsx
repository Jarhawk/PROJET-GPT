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
      className={`w-full p-2 border border-white/30 rounded-md bg-white/10 text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-mamastockGold ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
