// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
