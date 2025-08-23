// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/ui/checkbox.jsx

export function Checkbox({ checked, onChange, className = '', id, ariaLabel, ...props }) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      className={`h-4 w-4 rounded border-white/20 bg-white/10 text-mamastockGold focus:ring-mamastockGold ${className}`}
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
      {...props}
    />
  );
}

export default Checkbox;
