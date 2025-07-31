// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function StatCard({ label, value, variation = null, icon: Icon }) {
  return (
    <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-xl shadow p-4 flex items-center gap-3">
      {Icon && <Icon className="w-5 h-5 text-mamastock-gold" />}
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-lg font-bold">{value}</span>
        {variation !== null && (
          <span className={variation >= 0 ? "text-green-500 text-xs" : "text-red-500 text-xs"}>
            {variation > 0 ? "+" : ""}{variation}%
          </span>
        )}
      </div>
    </div>
  );
}
