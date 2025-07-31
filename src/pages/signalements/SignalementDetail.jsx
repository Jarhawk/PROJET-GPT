// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function SignalementDetail({ signalement }) {
  if (!signalement) return null;

  return (
    <div className="p-2 border border-white/20 rounded mb-2 bg-white/10 backdrop-blur-xl shadow">
      <div className="font-bold text-mamastock-gold">{signalement.titre}</div>
      <div className="text-sm text-gray-700">{signalement.description}</div>
      <div className="text-xs mt-1 text-gray-500 italic">Statut : {signalement.statut}</div>
    </div>
  );
}
