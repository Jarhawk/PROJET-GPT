import { useState } from "react";
import { useReporting } from "@/hooks/useReporting";
import { useAuth } from "@/context/AuthContext";

export default function Reporting() {
  const { mama_id, loading: authLoading } = useAuth();
  const [periode, setPeriode] = useState(() => new Date().toISOString().slice(0, 7));
  const { stats } = useReporting(periode);

  if (authLoading) {
    return (
      <div className="p-6 text-white text-center">⏳ Authentification...</div>
    );
  }

  if (!mama_id) return null;

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4 text-mamastock-gold">Reporting inventaire</h1>

      <label className="block mb-4 text-sm">
        Période :
        <input
          type="month"
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          className="ml-2 input"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white/10 border border-mamastock-gold rounded-xl p-4">
          <p className="text-sm">Quantité réelle</p>
          <p className="text-lg font-semibold">{stats.reel}</p>
        </div>
        <div className="bg-white/10 border border-mamastock-gold rounded-xl p-4">
          <p className="text-sm">Quantité théorique</p>
          <p className="text-lg font-semibold">{stats.theorique}</p>
        </div>
        <div className="bg-white/10 border border-mamastock-gold rounded-xl p-4">
          <p className="text-sm">Écart</p>
          <p className="text-lg font-semibold">{stats.ecart}</p>
        </div>
        <div className="bg-white/10 border border-mamastock-gold rounded-xl p-4">
          <p className="text-sm">Écart %</p>
          <p className="text-lg font-semibold">{stats.pourcent}%</p>
        </div>
      </div>

      {stats.detail.length > 0 && (
        <ul className="list-disc pl-6">
          {stats.detail.map((d) => (
            <li key={d.nom}>
              {d.nom} : {d.valeur}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
