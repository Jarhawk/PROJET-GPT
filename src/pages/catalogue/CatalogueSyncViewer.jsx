// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function CatalogueSyncViewer({ fournisseur_id }) {
  const { mama_id } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mama_id) return;
    setLoading(true);
    let query = supabase
      .from("catalogue_updates")
      .select("*, produit:produits(nom)")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false });
    if (fournisseur_id) query = query.eq("fournisseur_id", fournisseur_id);
    query.then(({ data }) => {
      setItems(data || []);
      setLoading(false);
    });
  }, [mama_id, fournisseur_id]);

  const acceptUpdate = async (row) => {
    await supabase
      .from("fournisseur_produits")
      .upsert(
        {
          produit_id: row.produit_id,
          fournisseur_id: row.fournisseur_id,
          prix_achat: row.nouvelle_valeur,
          date_livraison: new Date().toISOString().slice(0, 10),
          mama_id,
        },
        { onConflict: ["produit_id", "fournisseur_id", "date_livraison"] }
      );
    await supabase
      .from("catalogue_updates")
      .delete()
      .eq("id", row.id)
      .eq("mama_id", mama_id);
    setItems((it) => it.filter((i) => i.id !== row.id));
    toast.success("Modification appliquée");
  };

  const rejectUpdate = async (id) => {
    await supabase
      .from("catalogue_updates")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setItems((it) => it.filter((i) => i.id !== id));
  };

  if (loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">Mises à jour catalogue</h2>
      <TableContainer className="mt-2">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Produit</th>
              <th className="px-2 py-1">Ancien prix</th>
              <th className="px-2 py-1">Nouveau prix</th>
              <th className="px-2 py-1" />
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td className="border px-2 py-1">{u.produit?.nom || u.produit_id}</td>
                <td className="border px-2 py-1">{u.ancienne_valeur}</td>
                <td className="border px-2 py-1">{u.nouvelle_valeur}</td>
                <td className="border px-2 py-1 space-x-1">
                  <Button size="sm" onClick={() => acceptUpdate(u)}>
                    Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectUpdate(u.id)}
                  >
                    Rejeter
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
