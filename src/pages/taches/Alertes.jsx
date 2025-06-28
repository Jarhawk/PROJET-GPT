import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TableContainer from "@/components/ui/TableContainer";

export default function Alertes() {
  const { mama_id, loading: authLoading } = useAuth();
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAlertes() {
      if (!mama_id || authLoading) return;
      setLoading(true);
      const { data } = await supabase
        .from("alertes")
        .select("*")
        .eq("mama_id", mama_id)
        .order("created_at", { ascending: false });
      setAlertes(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    fetchAlertes();
  }, [mama_id, authLoading]);

  return (
    <div className="p-6 text-sm">
      <h1 className="text-2xl font-bold mb-4">Alertes</h1>
      {loading && <LoadingSpinner message="Chargement..." />}
      <TableContainer className="mt-2">
        <table className="min-w-full text-white text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1">Titre</th>
              <th className="px-2 py-1">Type</th>
              <th className="px-2 py-1">Date</th>
            </tr>
          </thead>
          <tbody>
            {alertes.map(a => (
              <tr key={a.id} className="">
                <td className="border px-2 py-1">{a.titre}</td>
                <td className="border px-2 py-1">{a.type}</td>
                <td className="border px-2 py-1">{new Date(a.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {alertes.length === 0 && !loading && (
              <tr>
                <td colSpan="3" className="py-4 text-center text-gray-500">Aucune alerte</td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
