// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-90 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
