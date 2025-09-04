// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useEffect, useState } from "react";

import { useAuth } from '@/hooks/useAuth';
import { useInventaires } from "@/hooks/useInventaires";
import { LiquidBackground, TouchLight } from "@/components/LiquidBackground";
import GlassCard from "@/components/ui/GlassCard";

export default function MobileInventaire() {
  const { mama_id, loading: authLoading } = useAuth();
  const { createInventaire } = useInventaires();
  const [produits, setProduits] = useState([]);
  const [stockFinal, setStockFinal] = useState({});

  useEffect(() => {
    if (authLoading || !mama_id) return;
    supabase.
    from("produits").
    select(
      "id, nom, famille_id, sous_famille_id, famille:familles!fk_produits_famille(nom), sous_famille:sous_familles!fk_produits_sous_famille(nom)"
    ).
    eq("mama_id", mama_id).
    then(({ data }) => setProduits(data || []));
  }, [mama_id, authLoading]);

  const handleChange = (id, value) => {
    setStockFinal((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (authLoading || !mama_id) return;
    const lignes = Object.entries(stockFinal).map(([produit_id, q]) => ({
      produit_id,
      quantite: parseFloat(q)
    }));
    if (!lignes.length) return;
    await createInventaire({
      date: new Date().toISOString().slice(0, 10),
      zone: "mobile",
      lignes
    });
    setStockFinal({});
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4 text-white">
      <LiquidBackground showParticles />
      <TouchLight />
      <GlassCard className="w-full max-w-sm space-y-4 relative z-10">
        <h2 className="text-lg font-bold">📦 Inventaire - Stock Final uniquement</h2>
        <ul className="space-y-2">
          {produits.map((p) =>
          <li key={p.id} className="flex justify-between items-center border p-2 rounded">
              <span>{p.nom}</span>
              <input
              type="number"
              className="w-20 border px-1 bg-transparent"
              value={stockFinal[p.id] || ""}
              onChange={(e) => handleChange(p.id, e.target.value)} />

            </li>
          )}
        </ul>
        <button
          onClick={handleSave}
          className="mt-4 w-full bg-mamastock-gold text-white py-2 rounded hover:bg-mamastock-gold-hover">

          Valider Inventaire
        </button>
      </GlassCard>
    </div>);

}