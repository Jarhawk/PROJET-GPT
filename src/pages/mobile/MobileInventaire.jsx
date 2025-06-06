import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MobileInventaire() {
  const [produits, setProduits] = useState([]);
  const [stockFinal, setStockFinal] = useState({});

  useEffect(() => {
    supabase.from("products").select("*").then(({ data }) => setProduits(data || []));
  }, []);

  const handleChange = (id, value) => {
    setStockFinal(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    for (const produitId in stockFinal) {
      await supabase.from("inventaire_lignes").insert([{
        produit_id: produitId,
        stock_final: parseFloat(stockFinal[produitId]),
        periode: "2025-05"
      }]);
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
      <button onClick={handleSave} className="mt-4 w-full bg-blue-600 text-white py-2 rounded">Valider Inventaire</button>
    </div>
  );
}