// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TableContainer from "@/components/ui/TableContainer";

const FOOD_COST_SEUIL = 35;

export default function CartePlats() {
  const { mama_id, loading: authLoading } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!mama_id || authLoading) return;
    supabase
      .from("fiches_techniques")
      .select("*")
      .eq("mama_id", mama_id)
      .eq("actif", true)
      .then(({ data }) => setFiches(data || []));
  }, [mama_id, authLoading]);

  const handleChangePV = async (fiche, newPV) => {
    setSavingId(fiche.id);
    const { error } = await supabase
      .from("fiches_techniques")
      .update({ prix_vente: newPV })
      .eq("id", fiche.id)
      .eq("mama_id", mama_id);
    if (!error) {
      setFiches(prev =>
        prev.map(f =>
          f.id === fiche.id ? { ...f, prix_vente: newPV } : f
        )
      );
      toast.success("Prix de vente enregistré !");
    } else {
      toast.error(error.message);
    }
    setSavingId(null);
  };

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">Carte des plats actifs</h1>
      <TableContainer className="mt-2">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Famille</th>
              <th className="px-2 py-1">Coût/portion (€)</th>
              <th className="px-2 py-1">Prix vente (€)</th>
              <th className="px-2 py-1">Food cost (%)</th>
            </tr>
          </thead>
          <tbody>
            {fiches.map(f => {
              const foodCost =
                f.prix_vente && f.cout_portion
                  ? ((f.cout_portion / f.prix_vente) * 100).toFixed(1)
                  : null;
              return (
                <tr key={f.id}>
                  <td className="border px-2 py-1">{f.nom}</td>
                  <td className="border px-2 py-1">{f.famille || "-"}</td>
                  <td className="border px-2 py-1">{f.cout_portion ? Number(f.cout_portion).toFixed(2) : "-"}</td>
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="input input-bordered w-24"
                      value={f.prix_vente ?? ""}
                      disabled={savingId === f.id}
                      onChange={e =>
                        handleChangePV(f, e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </td>
                  <td className={"border px-2 py-1 font-semibold " + (foodCost > FOOD_COST_SEUIL ? "text-red-600" : "")}>
                    {foodCost ?? "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
