export default function InputField({
  label,
  value,
  onChange,
  error,
  className = "",
  inputClass = "",
  ...props
}) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm text-white mb-1">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className={`input w-full ${error ? "border-red-500" : "border-white/20"} ${inputClass}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
