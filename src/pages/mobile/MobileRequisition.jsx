// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { LiquidBackground, TouchLight } from "@/components/LiquidBackground";
import GlassCard from "@/components/ui/GlassCard";

export default function MobileRequisition() {
  const { mama_id, loading: authLoading } = useAuth();
  const [produits, setProduits] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantite, setQuantite] = useState(1);

  useEffect(() => {
    if (authLoading || !mama_id) return;
    supabase
      .from("produits")
      .select("id, nom")
      .eq("mama_id", mama_id)
      .then(({ data }) => setProduits(data || []));
  }, [mama_id, authLoading]);

  const handleSubmit = async () => {
    if (authLoading || !mama_id) return;
    if (!selectedId || quantite <= 0) {
      toast.error("Sélectionnez un produit et une quantité valide");
      return;
    }

    const { data, error } = await supabase
      .from("requisitions")
      .insert([{ zone: "Bar", mama_id }])
      .select()
      .single();

    if (error || !data?.id) {
      toast.error("Erreur lors de la création de la réquisition");
      return;
    }

    const { error: lineError } = await supabase
      .from("requisition_lines")
      .insert([{ requisition_id: data.id, produit_id: selectedId, quantite, mama_id }]);

    if (lineError) {
      toast.error("Erreur lors de l'ajout du produit");
    } else {
      toast.success("Réquisition enregistrée !");
      setSelectedId("");
      setQuantite(1);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4 text-white">
      <LiquidBackground showParticles />
      <TouchLight />
      <GlassCard className="w-full max-w-sm space-y-4 relative z-10">
        <h2 className="text-xl font-bold text-center">🔄 Réquisition rapide</h2>

        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full border border-gray-300 rounded p-2 mb-3 bg-transparent"
        >
          <option value="">Sélectionner un produit</option>
          {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>

        <input
          type="number"
          min={1}
          value={quantite}
          onChange={(e) => setQuantite(Number(e.target.value))}
          className="w-full border border-gray-300 rounded p-2 mb-4 bg-transparent"
          placeholder="Quantité"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-mamastock-gold text-white py-2 rounded hover:bg-mamastock-gold-hover transition"
        >
          Créer réquisition
        </button>
      </GlassCard>
    </div>
  );
}
