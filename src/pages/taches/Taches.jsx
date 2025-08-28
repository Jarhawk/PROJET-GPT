// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTaches } from "@/hooks/useTaches";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TableContainer from "@/components/ui/TableContainer";
import TachesKanban from "@/components/taches/TachesKanban";
import GlassCard from "@/components/ui/GlassCard";
import { toast } from 'sonner';

export default function Taches() {
  const { taches, loading, error, fetchTaches, createTache } = useTaches();
  const { users, fetchUsers } = useUtilisateurs();
  const [filters, setFilters] = useState({ statut: "", priorite: "", utilisateur: "", start: "", end: "" });
  const [view, setView] = useState("table");
  const [quick, setQuick] = useState({ titre: "", date_echeance: "" });

  useEffect(() => {
    fetchUsers({ actif: true });
  }, [fetchUsers]);

  useEffect(() => {
    fetchTaches(filters);
  }, [fetchTaches, filters]);

  const handleChange = e => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleQuickChange = e => setQuick(q => ({ ...q, [e.target.name]: e.target.value }));
  const handleQuickSubmit = async e => {
    e.preventDefault();
    if (!quick.titre.trim()) return;
    try {
      await createTache(quick);
      toast.success('Tâche ajoutée');
      setQuick({ titre: '', date_echeance: '' });
    } catch (err) {
      toast.error(err?.message || "Erreur ajout");
    }
  };

  return (
    <div className="p-6 text-sm">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tâches planifiées</h1>
        <div className="flex gap-2">
          <Button onClick={() => setView(v => (v === 'table' ? 'kanban' : 'table'))}>
            {view === 'table' ? 'Vue Kanban' : 'Vue liste'}
          </Button>
          <Link to="/taches/new" className="btn">Créer une tâche</Link>
        </div>
      </div>
      <GlassCard title="Ajouter rapidement" className="mb-4">
        <form onSubmit={handleQuickSubmit} className="flex gap-2 flex-wrap items-end">
          <input
            className="input flex-1"
            name="titre"
            value={quick.titre}
            onChange={handleQuickChange}
            placeholder="Nouvelle tâche"
            required
          />
          <input
            type="date"
            className="form-input"
            name="date_echeance"
            value={quick.date_echeance}
            onChange={handleQuickChange}
          />
          <Button type="submit">Ajouter</Button>
        </form>
      </GlassCard>
      <GlassCard title="Filtres" className="mb-4">
        <div className="flex flex-wrap gap-2">
          <select name="statut" value={filters.statut} onChange={handleChange} className="form-input">
            <option value="">-- Statut --</option>
            <option value="a_faire">À faire</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
          </select>
        <select
          name="priorite"
          value={filters.priorite}
          onChange={handleChange}
          className="form-input"
        >
          <option value="">-- Priorité --</option>
          <option value="basse">Basse</option>
          <option value="moyenne">Moyenne</option>
          <option value="haute">Haute</option>
        </select>
        <select
          name="utilisateur"
          value={filters.utilisateur}
          onChange={handleChange}
          className="form-input"
        >
          <option value="">-- Assigné --</option>
          {(Array.isArray(users) ? users : []).map(u => (
            <option key={u.id} value={u.id}>
              {u.nom}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="start"
          value={filters.start}
          onChange={handleChange}
          className="form-input"
        />
        <input
          type="date"
          name="end"
          value={filters.end}
          onChange={handleChange}
          className="form-input"
        />
        <Button onClick={() => fetchTaches(filters)}>Filtrer</Button>
        </div>
      </GlassCard>
      {loading && <LoadingSpinner message="Chargement..." />}
      {error && <div className="text-red-600">{error}</div>}
      {view === 'table' ? (
        <TableContainer>
          <table className="min-w-full text-white">
            <thead>
              <tr>
                <th className="px-2 py-1">Statut</th>
                <th className="px-2 py-1">Titre</th>
                <th className="px-2 py-1">Priorité</th>
                <th className="px-2 py-1">Échéance</th>
                <th className="px-2 py-1">Assignés</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(taches) ? taches : []).map(t => (
                <tr key={t.id} className="border-t">
                  <td className="px-2 py-1">{t.statut}</td>
                  <td className="px-2 py-1">
                    <Link to={`/taches/${t.id}`} className="underline">
                      {t.titre}
                    </Link>
                  </td>
                  <td className="px-2 py-1">{t.priorite}</td>
                  <td className="px-2 py-1">{t.date_echeance}</td>
                  <td className="px-2 py-1">
                    {(Array.isArray(t.utilisateurs_taches)
                      ? t.utilisateurs_taches.map(a => a.utilisateur?.nom).filter(Boolean)
                      : [])
                      .join(", ")}
                  </td>
                </tr>
              ))}
              {(!Array.isArray(taches) || taches.length === 0) && !loading && (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">
                    Aucune tâche
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableContainer>
      ) : (
        <TachesKanban taches={taches} />
      )}
    </div>
  );
}
