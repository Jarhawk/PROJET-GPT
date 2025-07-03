// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`bg-mamastockGold hover:bg-mamastockGoldHover text-black font-semibold rounded-xl px-4 py-2 shadow transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
