// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/ui/textarea.jsx

export function Textarea({
  value,
  onChange,
  placeholder,
  className = "",
  ariaLabel,
  rows = 3,
  ...props
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel || placeholder || "Zone de texte"}
      rows={rows}
      className={`w-full px-4 py-2 bg-white/10 text-white placeholder-white/50 font-semibold rounded-xl shadow-lg border border-white/20 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/50 ${className}`}
      {...props}
    />
  );
}

export default Textarea;
