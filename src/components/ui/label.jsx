// src/components/ui/label.jsx

export function Label({ htmlFor, children, className = "" }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-mamastock-text mb-1 ${className}`}
    >
      {children}
    </label>
  );
}
