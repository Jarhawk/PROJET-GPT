// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { useCommandes } from "@/hooks/useCommandes";
import { useFournisseurs } from "@/hooks/useFournisseurs";

export default function Commandes() {
  const { mama_id, role } = useAuth();
  const { data: commandes, fetchCommandes, validateCommande, loading } = useCommandes();
  const { fournisseurs, fetchFournisseurs } = useFournisseurs();
  const [filters, setFilters] = useState({ fournisseur: "", statut: "", debut: "", fin: "" });

  useEffect(() => { fetchFournisseurs({ limit: 1000 }); }, [fetchFournisseurs]);
  useEffect(() => {
    if (!mama_id) return;
    fetchCommandes({ ...filters });
  }, [mama_id, filters, fetchCommandes]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div>
          <label className="block">Fournisseur</label>
          <select
            aria-label="Fournisseur"
            className="input"
            value={filters.fournisseur}
            onChange={e => setFilters(f => ({ ...f, fournisseur: e.target.value }))}
          >
            <option value="">Tous</option>
            {fournisseurs.map(f => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block">Date début</label>
          <input
            type="date"
            aria-label="Date début"
            className="input"
            value={filters.debut}
            onChange={e => setFilters(f => ({ ...f, debut: e.target.value }))}
          />
        </div>
        <div>
          <label className="block">Date fin</label>
          <input
            type="date"
            aria-label="Date fin"
            className="input"
            value={filters.fin}
            onChange={e => setFilters(f => ({ ...f, fin: e.target.value }))}
          />
        </div>
        <div>
          <label className="block">Statut</label>
          <select
            aria-label="Statut"
            className="input"
            value={filters.statut}
            onChange={e => setFilters(f => ({ ...f, statut: e.target.value }))}
          >
            <option value="">Tous</option>
            <option value="brouillon">Brouillon</option>
            <option value="validée">Validée</option>
            <option value="envoyée">Envoyée</option>
          </select>
        </div>
        <Link to="/commandes/nouvelle" className="btn">Nouvelle commande</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-left">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Fournisseur</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Chargement...</td>
              </tr>
            ) : (
              commandes.map((c) => (
                <tr key={c.id} className="border-b border-white/10">
                  <td>{c.reference}</td>
                  <td>{c.fournisseur?.nom || '-'}</td>
                  <td>{c.date_commande}</td>
                  <td>{c.statut}</td>
                  <td>{c.total || 0}</td>
                  <td className="space-x-2">
                    <Link to={`/commandes/${c.id}`}>Voir</Link>
                    {role === 'admin' && c.statut === 'brouillon' && (
                      <button onClick={() => validateCommande(c.id)}>Valider</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
