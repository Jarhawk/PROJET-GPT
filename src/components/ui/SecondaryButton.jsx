// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`border border-white/40 text-white rounded-xl px-4 py-2 hover:bg-white/10 backdrop-blur transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
