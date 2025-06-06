export default function SignalementDetail({ signalement }) {
  if (!signalement) return null;

  return (
    <div className="p-2 border rounded mb-2 bg-white shadow">
      <div className="font-bold text-mamastock-gold">{signalement.titre}</div>
      <div className="text-sm text-gray-700">{signalement.description}</div>
      <div className="text-xs mt-1 text-gray-500 italic">Statut : {signalement.statut}</div>
    </div>
  );
}
