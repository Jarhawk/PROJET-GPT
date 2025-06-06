// src/components/ui/input.jsx

export function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  ariaLabel,
  ...props
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel || placeholder || "Champ de saisie"}
      className={`w-full p-2 border border-mamastock-gold rounded-md bg-white text-mamastock-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mamastock-gold disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
}
