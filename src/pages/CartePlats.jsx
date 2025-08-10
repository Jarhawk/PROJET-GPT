// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from "@/lib/supabase";
import { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TableContainer from "@/components/ui/TableContainer";

const FOOD_COST_SEUIL = 35;

export default function CartePlats() {
  const { mama_id, loading: authLoading } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [search, setSearch] = useState("");
  const [familleFilter, setFamilleFilter] = useState("");
  const [onlyAboveThreshold, setOnlyAboveThreshold] = useState(false);

  useEffect(() => {
    if (!mama_id || authLoading) return;
    Promise.all([
      supabase
        .from("fiches_techniques")
        .select("*")
        .eq("mama_id", mama_id)
        .eq("actif", true),
      supabase
        .from("familles")
        .select("nom")
        .eq("mama_id", mama_id)
        .eq("actif", true),
    ]).then(([ficheRes, familleRes]) => {
      setFiches(ficheRes.data || []);
      setFamilles((familleRes.data || []).map((f) => f.nom));
    });
  }, [mama_id, authLoading]);

  const filteredFiches = fiches.filter((f) => {
    const foodCost =
      f.prix_vente && f.cout_portion
        ? (f.cout_portion / f.prix_vente) * 100
        : null;
    if (search && !f.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (familleFilter && f.famille !== familleFilter) return false;
    if (onlyAboveThreshold && (foodCost === null || foodCost <= FOOD_COST_SEUIL)) return false;
    return true;
  });


  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">Carte des plats actifs</h1>
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <input
          className="form-input"
          placeholder="Recherche"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-select"
          value={familleFilter}
          onChange={(e) => setFamilleFilter(e.target.value)}
        >
          <option value="">Toutes familles</option>
          {familles.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            className="checkbox"
            checked={onlyAboveThreshold}
            onChange={(e) => setOnlyAboveThreshold(e.target.checked)}
          />
          <span>Ratio &gt; {FOOD_COST_SEUIL}%</span>
        </label>
      </div>
      <TableContainer className="mt-2">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Famille</th>
              <th className="px-2 py-1">Coût/portion (€)</th>
              <th className="px-2 py-1">Prix vente (€)</th>
              <th className="px-2 py-1">Food cost (%)</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiches.map(f => {
              const foodCost =
                f.prix_vente && f.cout_portion
                  ? ((f.cout_portion / f.prix_vente) * 100).toFixed(1)
                  : null;
              return (
                <tr key={f.id}>
                  <td className="border px-2 py-1">{f.nom}</td>
                  <td className="border px-2 py-1">{f.famille || "-"}</td>
                  <td className="border px-2 py-1">{f.cout_portion ? Number(f.cout_portion).toFixed(2) : "-"}</td>
                  <td className="border px-2 py-1">
                    {f.prix_vente ? Number(f.prix_vente).toFixed(2) : "-"}
                  </td>
                  <td className={"border px-2 py-1 font-semibold " + (foodCost > FOOD_COST_SEUIL ? "text-red-600" : "")}>
                    {foodCost ?? "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
