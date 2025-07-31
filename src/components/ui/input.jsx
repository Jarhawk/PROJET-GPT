// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
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
      className={`w-full px-4 py-2 font-semibold text-white placeholder-white/50 bg-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
}
