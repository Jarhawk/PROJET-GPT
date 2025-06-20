import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function MobileInventaire() {
  const { mama_id, loading: authLoading } = useAuth();
  const [produits, setProduits] = useState([]);
  const [stockFinal, setStockFinal] = useState({});

  useEffect(() => {
    if (authLoading || !mama_id) return;
    supabase
      .from("products")
      .select("*")
      .eq("mama_id", mama_id)
      .then(({ data }) => setProduits(data || []));
  }, [mama_id, authLoading]);

  const handleChange = (id, value) => {
    setStockFinal(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (authLoading || !mama_id) return;
    for (const produitId in stockFinal) {
      await supabase.from("inventaire_lignes").insert([
        {
          produit_id: produitId,
          stock_final: parseFloat(stockFinal[produitId]),
          periode: "2025-05",
          mama_id,
        },
      ]);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">📦 Inventaire - Stock Final uniquement</h2>
      <ul className="space-y-2">
        {produits.map(p => (
          <li key={p.id} className="flex justify-between items-center border p-2 rounded">
            <span>{p.nom}</span>
            <input
              type="number"
              className="w-20 border px-1"
              value={stockFinal[p.id] || ""}
              onChange={(e) => handleChange(p.id, e.target.value)}
            />
          </li>
        ))}
      </ul>
      <button
        onClick={handleSave}
        className="mt-4 w-full bg-mamastock-gold text-white py-2 rounded hover:bg-mamastock-gold-hover"
      >
        Valider Inventaire
      </button>
    </div>
  );
}