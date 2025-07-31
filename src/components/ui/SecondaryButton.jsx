// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition-all ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
