// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function InputField({
  label,
  value,
  onChange,
  error,
  className = "",
  inputClass = "",
  id,
  ...props
}) {
  const inputId = id || props.name || label?.toString().toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm text-white/90 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        value={value}
        onChange={onChange}
        className={`input w-full ${error ? "border-red-500" : "border-white/20"} ${inputClass}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
