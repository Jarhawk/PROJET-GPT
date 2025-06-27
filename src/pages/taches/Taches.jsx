import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTaches } from "@/hooks/useTaches";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Taches() {
  const { taches, loading, error, getTaches } = useTaches();
  const [filters, setFilters] = useState({ type: "", statut: "", start: "", end: "" });

  useEffect(() => {
    getTaches(filters);
  }, [getTaches, filters]);

  const handleChange = e => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="p-6 text-sm">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tâches planifiées</h1>
        <Link to="/taches/new" className="bg-white/10 backdrop-blur-lg text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:shadow-lg">Créer une tâche</Link>
      </div>
      <div className="flex gap-2 mb-4">
        <select name="type" value={filters.type} onChange={handleChange} className="input">
          <option value="">-- Fréquence --</option>
          <option value="quotidien">Quotidien</option>
          <option value="hebdo">Hebdomadaire</option>
          <option value="mensuelle">Mensuelle</option>
          <option value="unique">Unique</option>
        </select>
        <select name="statut" value={filters.statut} onChange={handleChange} className="input">
          <option value="">-- Statut --</option>
          <option value="fait">Réalisée</option>
          <option value="a faire">En attente</option>
          <option value="en retard">En retard</option>
        </select>
        <input type="date" name="start" value={filters.start} onChange={handleChange} className="input" />
        <input type="date" name="end" value={filters.end} onChange={handleChange} className="input" />
        <Button onClick={() => getTaches(filters)}>Filtrer</Button>
      </div>
      {loading && <LoadingSpinner message="Chargement..." />}
      {error && <div className="text-red-600">{error}</div>}
      <table className="min-w-full text-white">
        <thead>
          <tr>
            <th className="px-2 py-1">Nom</th>
            <th className="px-2 py-1">Fréquence</th>
            <th className="px-2 py-1">Prochaine occurrence</th>
            <th className="px-2 py-1">Statut</th>
          </tr>
        </thead>
        <tbody>
          {taches.map(t => (
            <tr key={t.id} className="border-t">
              <td className="px-2 py-1">{t.nom}</td>
              <td className="px-2 py-1">{t.frequence}</td>
              <td className="px-2 py-1">{t.next_occurrence || ""}</td>
              <td className="px-2 py-1">{t.status || "à faire"}</td>
            </tr>
          ))}
          {taches.length === 0 && !loading && (
            <tr>
              <td colSpan="4" className="py-4 text-center text-gray-500">Aucune tâche</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
