import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Alertes() {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAlertes() {
      setLoading(true);
      const { data } = await supabase
        .from("alertes")
        .select("*")
        .order("created_at", { ascending: false });
      setAlertes(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    fetchAlertes();
  }, []);

  return (
    <div className="p-6 text-sm">
      <h1 className="text-2xl font-bold mb-4">Alertes</h1>
      {loading && <div>Chargement...</div>}
      <table className="min-w-full text-white">
        <thead>
          <tr>
            <th className="px-2 py-1">Titre</th>
            <th className="px-2 py-1">Type</th>
            <th className="px-2 py-1">Date</th>
          </tr>
        </thead>
        <tbody>
          {alertes.map(a => (
            <tr key={a.id} className="border-t">
              <td className="px-2 py-1">{a.titre}</td>
              <td className="px-2 py-1">{a.type}</td>
              <td className="px-2 py-1">{new Date(a.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {alertes.length === 0 && !loading && (
            <tr>
              <td colSpan="3" className="py-4 text-center text-gray-500">Aucune alerte</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
