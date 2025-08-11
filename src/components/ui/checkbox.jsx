// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/ui/checkbox.jsx

export function Checkbox({ checked, onChange, className = '', ...props }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`h-4 w-4 rounded border-white/20 bg-white/10 text-mamastockGold focus:ring-mamastockGold ${className}`}
      {...props}
      id="fld-field-gk8a" />
  );
}

export default Checkbox;
