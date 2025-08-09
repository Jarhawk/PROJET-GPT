// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AccessMultiSites() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_mama_access")
      .select("id, user_id, mama_id, role");
    setLoading(false);
    if (error) {
      setError(error.message || String(error));
      setRows([]);
    } else {
      setError(null);
      setRows(data || []);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-8 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Accès multi-sites</h1>
      {loading && <LoadingSpinner message="Chargement..." />}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <TableContainer>
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1">Utilisateur</th>
              <th className="px-2 py-1">Mama</th>
              <th className="px-2 py-1">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-2 py-1">{r.user_id}</td>
                <td className="px-2 py-1">{r.mama_id}</td>
                <td className="px-2 py-1">{r.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
