import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useFournisseurAPI } from "@/hooks/useFournisseurAPI";

export default function CommandesEnvoyees() {
  const { mama_id } = useAuth();
  const { envoyerCommande } = useFournisseurAPI();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mama_id) return;
    setLoading(true);
    supabase
      .from("commandes")
      .select("*, fournisseur:fournisseurs(nom)")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [mama_id]);

  const relancer = async (id) => {
    await envoyerCommande(id);
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">Commandes envoyées</h2>
      <table className="w-full table-auto text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1">Fournisseur</th>
            <th className="px-2 py-1">Statut</th>
            <th className="px-2 py-1" />
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td className="px-2 py-1">{c.created_at?.slice(0, 10)}</td>
              <td className="px-2 py-1">{c.fournisseur?.nom || "-"}</td>
              <td className="px-2 py-1">{c.statut}</td>
              <td className="px-2 py-1">
                <Button size="sm" onClick={() => relancer(c.id)}>
                  Relancer
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
