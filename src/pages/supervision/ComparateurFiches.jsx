import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMultiMama } from "@/context/MultiMamaContext";
import TableContainer from "@/components/ui/TableContainer";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ComparateurFiches() {
  const { mamas } = useMultiMama();
  const [ficheId, setFicheId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!ficheId || mamas.length === 0) return;
    setLoading(true);
    const { data } = await supabase.rpc("compare_fiche", {
      fiche_id: ficheId,
      mama_ids: mamas.map((m) => m.id),
    });
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  return (
    <div className="p-6 container mx-auto text-shadow">
      <h1 className="text-2xl font-bold mb-4">Comparateur de fiches</h1>
      <div className="flex gap-2 mb-4">
        <input
          className="input input-bordered"
          placeholder="ID fiche"
          value={ficheId}
          onChange={(e) => setFicheId(e.target.value)}
        />
        <Button onClick={handleCompare} disabled={loading || !ficheId}>
          Comparer
        </Button>
      </div>
      {loading && <LoadingSpinner message="Chargement..." />}
      {results.length > 0 && (
        <TableContainer>
          <table className="min-w-full text-center">
            <thead>
              <tr>
                <th className="px-2 py-1">Mama</th>
                <th className="px-2 py-1">Coût</th>
                <th className="px-2 py-1">Rendement</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.mama_id}>
                  <td className="px-2 py-1">{r.nom}</td>
                  <td className="px-2 py-1">{r.cout || '-'}</td>
                  <td className="px-2 py-1">{r.rendement || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}
    </div>
  );
}
