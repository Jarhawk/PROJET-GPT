// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
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
        .select("id, nom, famille, prix_vente, cout_portion")
        .eq("mama_id", mama_id)
        .eq("actif", true),
      supabase
        .from("familles")
        .select("nom")
        .eq("mama_id", mama_id)
        .eq("actif", true),
    ]).then(([ficheRes, familleRes]) => {
      setFiches(ficheRes.data || []);
      const fams = [];
      for (const f of Array.isArray(familleRes.data) ? familleRes.data : []) {
        fams.push(f.nom);
      }
      setFamilles(fams);
    });
  }, [mama_id, authLoading]);

  const fichesList = Array.isArray(fiches) ? fiches : [];
  const filteredFiches = [];
  for (const f of fichesList) {
    const foodCost =
      f.prix_vente && f.cout_portion
        ? (f.cout_portion / f.prix_vente) * 100
        : null;
    if (search && !f.nom.toLowerCase().includes(search.toLowerCase())) continue;
    if (familleFilter && f.famille !== familleFilter) continue;
    if (onlyAboveThreshold && (foodCost === null || foodCost <= FOOD_COST_SEUIL)) continue;
    filteredFiches.push({ ...f, foodCost });
  }

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
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
          {(() => {
            const opts = [];
            for (const f of Array.isArray(familles) ? familles : []) {
              opts.push(<option key={f} value={f}>{f}</option>);
            }
            return opts;
          })()}
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
            {(() => {
              const rows = [];
              for (const f of filteredFiches) {
                const fc = f.foodCost !== null ? f.foodCost.toFixed(1) : null;
                rows.push(
                  <tr key={f.id}>
                    <td className="border px-2 py-1">{f.nom}</td>
                    <td className="border px-2 py-1">{f.famille || "-"}</td>
                    <td className="border px-2 py-1">{f.cout_portion ? Number(f.cout_portion).toFixed(2) : "-"}</td>
                    <td className="border px-2 py-1">
                      {f.prix_vente ? Number(f.prix_vente).toFixed(2) : "-"}
                    </td>
                    <td className={"border px-2 py-1 font-semibold " + (fc > FOOD_COST_SEUIL ? "text-red-600" : "")}>
                      {fc ?? "-"}
                    </td>
                  </tr>
                );
              }
              return rows;
            })()}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}

