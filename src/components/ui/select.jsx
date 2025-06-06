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
      className={`w-full p-2 border border-mamastock-gold rounded-md bg-white text-mamastock-text focus:outline-none focus:ring-2 focus:ring-mamastock-gold ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
