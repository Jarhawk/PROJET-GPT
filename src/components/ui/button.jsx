// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
