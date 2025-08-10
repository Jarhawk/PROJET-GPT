// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function FormField({ label, htmlFor, required, help, error, children, full = false }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-gray-800">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
      )}
      <div className="relative">{children}</div>
      {help && !error && <p className="mt-1 text-xs text-gray-500">{help}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default FormField;

