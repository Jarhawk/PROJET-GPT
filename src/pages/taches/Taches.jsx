// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTaches } from "@/hooks/useTaches";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TableContainer from "@/components/ui/TableContainer";
import TachesKanban from "@/components/taches/TachesKanban";

export default function Taches() {
  const { taches, loading, error, getTaches, createTache } = useTaches();
  const { users, fetchUsers } = useUtilisateurs();
  const [filters, setFilters] = useState({ statut: "", priorite: "", assigne: "", start: "", end: "" });
  const [view, setView] = useState('table');
  const [quick, setQuick] = useState({ titre: '', date_echeance: '' });

  useEffect(() => {
    fetchUsers({ actif: true });
  }, [fetchUsers]);

  useEffect(() => {
    getTaches(filters);
  }, [getTaches, filters]);

  const handleChange = e => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleQuickChange = e => setQuick(q => ({ ...q, [e.target.name]: e.target.value }));
  const handleQuickSubmit = async e => {
    e.preventDefault();
    if (!quick.titre.trim()) return;
    await createTache(quick);
    setQuick({ titre: '', date_echeance: '' });
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
      <form onSubmit={handleQuickSubmit} className="flex gap-2 mb-4">
        <input className="input flex-1" name="titre" value={quick.titre} onChange={handleQuickChange} placeholder="Nouvelle tâche" required />
        <input type="date" className="input" name="date_echeance" value={quick.date_echeance} onChange={handleQuickChange} />
        <Button type="submit">Ajouter</Button>
      </form>
      <div className="flex flex-wrap gap-2 mb-4">
        <select name="statut" value={filters.statut} onChange={handleChange} className="input">
          <option value="">-- Statut --</option>
          <option value="a_faire">À faire</option>
          <option value="en_cours">En cours</option>
          <option value="terminee">Terminée</option>
        </select>
        <select name="priorite" value={filters.priorite} onChange={handleChange} className="input">
          <option value="">-- Priorité --</option>
          <option value="basse">Basse</option>
          <option value="moyenne">Moyenne</option>
          <option value="haute">Haute</option>
        </select>
        <select name="assigne" value={filters.assigne} onChange={handleChange} className="input">
          <option value="">-- Assigné --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.nom}</option>
          ))}
        </select>
        <input type="date" name="start" value={filters.start} onChange={handleChange} className="input" />
        <input type="date" name="end" value={filters.end} onChange={handleChange} className="input" />
        <Button onClick={() => getTaches(filters)}>Filtrer</Button>
      </div>
      {loading && <LoadingSpinner message="Chargement..." />}
      {error && <div className="text-red-600">{error}</div>}
      {view === 'table' ? (
        <TableContainer>
          <table className="min-w-full text-white">
            <thead>
              <tr>
                <th className="px-2 py-1">Statut</th>
                <th className="px-2 py-1">Titre</th>
                <th className="px-2 py-1">Début</th>
                <th className="px-2 py-1">Échéance</th>
                <th className="px-2 py-1">Assignés</th>
                <th className="px-2 py-1">Récurrence</th>
              </tr>
            </thead>
            <tbody>
              {taches.map(t => (
                <tr key={t.id} className="border-t">
                  <td className="px-2 py-1">{t.statut}</td>
                  <td className="px-2 py-1">{t.titre}</td>
                  <td className="px-2 py-1">{t.date_debut}</td>
                  <td className="px-2 py-1">{t.date_echeance}</td>
                  <td className="px-2 py-1">{(t.assignes || []).length}</td>
                  <td className="px-2 py-1">{t.recurrente ? t.frequence : ''}</td>
                </tr>
              ))}
              {taches.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">Aucune tâche</td>
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
