// src/components/ui/badge.jsx

export function Badge({ children, color = "gold", className = "", ariaLabel }) {
  const colorClasses = {
    gold: "bg-mamastock-gold text-white",
    gray: "bg-gray-200 text-gray-800",
    red: "bg-red-500 text-white",
    green: "bg-green-500 text-white",
    blue: "bg-blue-500 text-white",
  };

  const classes = `${colorClasses[color] || colorClasses.gold} text-xs px-2 py-1 rounded inline-block ${className}`;

  return (
    <span className={classes} role="status" aria-label={ariaLabel || undefined}>
      {children}
    </span>
  );
}
