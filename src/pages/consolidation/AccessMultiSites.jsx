// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AccessMultiSites() {
  const { mama_id: mamaId } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("user_mama_access")
      .select("id, user_id, mama_id, role")
      .eq("mama_id", mamaId)
      .then(({ data, error }) => {
        if (error) {
          if (error.code === "42P01") {
            toast.error("Table user_mama_access introuvable");
          } else {
            toast.error("Erreur de chargement");
            console.error(error);
          }
          setRows([]);
        } else {
          setRows(Array.isArray(data) ? data : []);
        }
        setLoading(false);
      });
  }, [mamaId]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Accès multi-sites</h1>
      {loading ? (
        <LoadingSpinner message="Chargement..." />
      ) : (
        <TableContainer>
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Site</th>
                <th>Rôle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.user_id}</td>
                  <td>{r.mama_id}</td>
                  <td>{r.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}
    </div>
  );
}
