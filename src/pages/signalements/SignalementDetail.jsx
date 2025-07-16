// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function SignalementDetail({ signalement }) {
  if (!signalement) return null;

  return (
    <div className="p-2 border border-borderGlass rounded mb-2 bg-glass backdrop-blur shadow">
      <div className="font-bold text-mamastock-gold">{signalement.type}</div>
      <div className="text-sm text-gray-700">{signalement.description}</div>
    </div>
  );
}
