// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`w-full py-2 bg-white/30 text-white font-semibold rounded-md hover:bg-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
