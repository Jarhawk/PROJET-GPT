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
      className={`bg-white/10 backdrop-blur-lg text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${className}`}
      aria-label={ariaLabel || undefined}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
