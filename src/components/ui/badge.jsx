// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/ui/badge.jsx

export function Badge({ children, color = "gold", className = "", ariaLabel }) {
  const colorClasses = {
    gold: "bg-mamastock-gold text-white",
    gray: "bg-white/20 text-white backdrop-blur-xl",
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
