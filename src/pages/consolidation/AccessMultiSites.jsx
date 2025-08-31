// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";

export default function AccessMultiSites() {
  const { mama_id: mamaId } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('mamas')
      .select('id, nom')
      .eq('id', mamaId)
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message);
          setRows([]);
        } else {
          setRows(Array.isArray(data) ? data : []);
        }
        setLoading(false);
      });
  }, [mamaId]);

  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Sites accessibles</h1>
      {loading ? (
        <LoadingSpinner message="Chargement..." />
      ) : (
        <TableContainer>
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const items = [];
                for (const r of safeRows) {
                  items.push(
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.nom}</td>
                    </tr>
                  );
                }
                return items;
              })()}
            </tbody>
          </table>
        </TableContainer>
      )}
    </div>
  );
}
