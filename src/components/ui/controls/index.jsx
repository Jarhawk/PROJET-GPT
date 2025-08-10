// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function Input(props) {
  const { id, className = "", ...rest } = props;
  return (
    <input
      id={id}
      className={`block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 ${className}`}
      {...rest}
    />
  );
}

export function Select(props) {
  const { id, className = "", children, ...rest } = props;
  return (
    <select
      id={id}
      className={`block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea(props) {
  const { id, className = "", ...rest } = props;
  return (
    <textarea
      id={id}
      className={`block w-full min-h-[88px] rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 ${className}`}
      {...rest}
    />
  );
}

export function Checkbox({ id, label, className = "", ...rest }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input id={id} type="checkbox" className={`h-4 w-4 rounded border-gray-300 ${className}`} {...rest} />
      {label}
    </label>
  );
}

export function Button({ children, variant = "primary", className = "", ...rest }) {
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-black",
    ghost: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

