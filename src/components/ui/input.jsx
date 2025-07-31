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
      className={`w-full px-4 py-2 bg-white/70 text-black placeholder-black/60 rounded-xl shadow-sm border border-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-mamastockGold disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
}
