// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl bg-glass border border-borderGlass backdrop-blur hover:bg-white/10 text-white font-semibold shadow transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
