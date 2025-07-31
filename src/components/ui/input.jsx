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
      className={`w-full p-2 rounded-lg border border-white/20 bg-white/10 dark:bg-[#202638]/50 backdrop-blur text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/70 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
}
