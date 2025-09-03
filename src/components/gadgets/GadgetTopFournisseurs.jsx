import React from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import useTopFournisseurs from '../../hooks/gadgets/useTopFournisseurs.js';

export default function GadgetTopFournisseurs() {
  const { mamaId } = useAuth();
  const { data, isLoading, error } = useTopFournisseurs(mamaId, { limit: 5 });

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <h3 className="font-medium mb-3">Top fournisseurs</h3>
      {isLoading && <div className="animate-pulse h-10 bg-white/10 rounded" />}
      {error && <div className="text-red-300 text-sm">Erreur: {error.message}</div>}
      {!isLoading && !error && (
        <ul className="space-y-2">
          {data.map((row) => (
            <li key={row.fournisseur_id} className="flex justify-between text-sm">
              <span className="truncate mr-3">{row.fournisseur}</span>
              <span className="font-medium">{Number(row.montant ?? 0).toFixed(2)} €</span>
            </li>
          ))}
          {data.length === 0 && <li className="text-slate-400 text-sm">Aucune donnée</li>}
        </ul>
      )}
    </div>
  );
}
