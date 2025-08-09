// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect } from "react";
import { useLogs } from "@/hooks/useLogs";

export default function RapportsPage() {
  const { rapports, fetchRapports, downloadRapport } = useLogs();

  useEffect(() => {
    fetchRapports();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Rapports générés</h1>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="border px-2">Module</th>
            <th className="border px-2">Type</th>
            <th className="border px-2">Période</th>
            <th className="border px-2">Généré le</th>
            <th className="border px-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {(rapports || []).map((r) => (
            <tr key={r.id} className="text-center">
              <td className="border px-2">{r.module}</td>
              <td className="border px-2">{r.type}</td>
              <td className="border px-2">
                {r.periode_debut || "-"} - {r.periode_fin || "-"}
              </td>
              <td className="border px-2">{r.date_generation}</td>
              <td className="border px-2">
                <button
                  onClick={() => downloadRapport(r.id)}
                  className="px-2 py-1 bg-mamastockGold text-white rounded"
                >
                  Télécharger
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

