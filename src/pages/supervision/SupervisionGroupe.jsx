// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useMultiMama } from "@/context/MultiMamaContext";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

export default function SupervisionGroupe() {
  const { mamas } = useMultiMama();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("stats_multi_mamas");
    const rows = Array.isArray(data) ? data : [];
    setStats(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    const mamaList = Array.isArray(mamas) ? mamas : [];
    if (mamaList.length > 0) fetchStats();
  }, [mamas, fetchStats]);

  const mamaList = Array.isArray(mamas) ? mamas : [];
  let display = [];
  if (stats.length) {
    display = stats;
  } else {
    for (const m of mamaList) display.push({ ...m, mama_id: m.id });
  }

  return (
    <div className="p-6 flex justify-center">
      <GlassCard className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Supervision Groupe</h1>
        {loading && <LoadingSpinner message="Chargement..." />}
        <TableContainer>
          <table className="min-w-full text-center">
            <thead>
              <tr>
                <th className="px-2 py-1">Établissement</th>
                <th className="px-2 py-1">Coût matière</th>
                <th className="px-2 py-1">Factures</th>
                <th className="px-2 py-1">Validation</th>
                <th className="px-2 py-1">Inventaire</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = [];
                for (const d of display) {
                  rows.push(
                    <tr key={d.mama_id}>
                      <td className="px-2 py-1">{d.nom}</td>
                      <td className="px-2 py-1">{d.cout_matiere || '-'}</td>
                      <td className="px-2 py-1">{d.nb_factures || '-'}</td>
                      <td className="px-2 py-1">{d.taux_validation || '-'}</td>
                      <td className="px-2 py-1">{d.ecart_inventaire || '-'}</td>
                    </tr>
                  );
                }
                return rows;
              })()}
            </tbody>
          </table>
        </TableContainer>
      </GlassCard>
    </div>
  );
}
