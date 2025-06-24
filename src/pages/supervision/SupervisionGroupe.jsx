import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMultiMama } from "@/context/MultiMamaContext";
import TableContainer from "@/components/ui/TableContainer";

export default function SupervisionGroupe() {
  const { mamas } = useMultiMama();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mamas.length > 0) fetchStats();
  }, [mamas]);

  async function fetchStats() {
    setLoading(true);
    const ids = mamas.map((m) => m.id);
    const { data } = await supabase.rpc("stats_multi_mamas", { mama_ids: ids });
    setStats(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const display = stats.length ? stats : mamas.map((m) => ({ ...m, mama_id: m.id }));

  return (
    <div className="p-6 container mx-auto text-shadow">
      <h1 className="text-2xl font-bold mb-4">Supervision Groupe</h1>
      {loading && <div className="mb-2">Chargement...</div>}
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
            {display.map((d) => (
              <tr key={d.mama_id}>
                <td className="px-2 py-1">{d.nom}</td>
                <td className="px-2 py-1">{d.cout_matiere || '-'}</td>
                <td className="px-2 py-1">{d.nb_factures || '-'}</td>
                <td className="px-2 py-1">{d.taux_validation || '-'}</td>
                <td className="px-2 py-1">{d.ecart_inventaire || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
