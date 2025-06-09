// src/components/ui/button.jsx

export function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  ariaLabel,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-mamastock-gold hover:bg-mamastock-gold-hover text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-mamastock-gold ${className}`}
      aria-label={ariaLabel || undefined}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
