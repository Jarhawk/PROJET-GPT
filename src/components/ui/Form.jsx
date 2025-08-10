// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function Form({ children, title, description, onSubmit, className = "" }) {
  return (
    <form onSubmit={onSubmit} className={`mx-auto w-full max-w-3xl space-y-6 ${className}`}>
      {title && <h1 className="text-xl font-semibold">{title}</h1>}
      {description && <p className="text-sm text-gray-500">{description}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </form>
  );
}

export default Form;

