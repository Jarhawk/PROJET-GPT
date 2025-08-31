// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
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
        .from("v_alertes_rupture")
        .select("produit_id, nom, stock_min, stock_actuel, manque")
        .eq("mama_id", mama_id)
        .order("nom", { ascending: true });
      const rows = Array.isArray(data) ? data : [];
      setAlertes(rows);
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
              <th className="px-2 py-1">Produit</th>
              <th className="px-2 py-1 text-right">Stock min</th>
              <th className="px-2 py-1 text-right">Stock actuel</th>
              <th className="px-2 py-1 text-right">Manque</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const rows = [];
              const list = Array.isArray(alertes) ? alertes : [];
              for (const a of list) {
                rows.push(
                  <tr key={a.produit_id} className="">
                    <td className="border px-2 py-1">{a.nom}</td>
                    <td className="border px-2 py-1 text-right">{a.stock_min}</td>
                    <td className="border px-2 py-1 text-right">{a.stock_actuel}</td>
                    <td className="border px-2 py-1 text-right">{a.manque}</td>
                  </tr>
                );
              }
              if (rows.length === 0 && !loading) {
                rows.push(
                  <tr key="empty">
                    <td colSpan="4" className="py-4 text-center text-gray-500">
                      Aucune alerte
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
