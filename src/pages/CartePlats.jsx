import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";

const FOOD_COST_SEUIL = 35;

export default function CartePlats() {
  const { isAuthenticated, claims } = useAuth();
  const [fiches, setFiches] = useState([]);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!claims?.mama_id) return;
    supabase
      .from("fiches_techniques")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .eq("actif", true)
      .then(({ data }) => setFiches(data || []));
  }, [claims?.mama_id]);

  const handleChangePV = async (fiche, newPV) => {
    setSavingId(fiche.id);
    const { error } = await supabase
      .from("fiches_techniques")
      .update({ prix_vente: newPV })
      .eq("id", fiche.id)
      .eq("mama_id", claims.mama_id);
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

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">Carte des plats actifs</h1>
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
                <td className="px-2 py-1">{f.nom}</td>
                <td className="px-2 py-1">{f.famille || "-"}</td>
                <td className="px-2 py-1">{f.cout_portion ? Number(f.cout_portion).toFixed(2) : "-"}</td>
                <td className="px-2 py-1">
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
                <td className={"px-2 py-1 font-semibold " + (foodCost > FOOD_COST_SEUIL ? "text-red-600" : "")}>
                  {foodCost ?? "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
