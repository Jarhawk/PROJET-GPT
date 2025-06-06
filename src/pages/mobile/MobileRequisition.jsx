// ✅ src/pages/mobile/MobileRequisition.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";

export default function MobileRequisition() {
  const [produits, setProduits] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantite, setQuantite] = useState(1);

  useEffect(() => {
    supabase.from("products").select("id, nom").then(({ data }) => setProduits(data || []));
  }, []);

  const handleSubmit = async () => {
    if (!selectedId || quantite <= 0) {
      toast.error("Sélectionnez un produit et une quantité valide");
      return;
    }

    const { data, error } = await supabase
      .from("requisitions")
      .insert([{ zone: "Bar" }])
      .select()
      .single();

    if (error || !data?.id) {
      toast.error("Erreur lors de la création de la réquisition");
      return;
    }

    const { error: lineError } = await supabase
      .from("requisition_lines")
      .insert([{ requisition_id: data.id, produit_id: selectedId, quantite }]);

    if (lineError) {
      toast.error("Erreur lors de l'ajout du produit");
    } else {
      toast.success("Réquisition enregistrée !");
      setSelectedId("");
      setQuantite(1);
    }
  };

  return (
    <div className="p-4 animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-center">🔄 Réquisition rapide</h2>

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full border border-gray-300 rounded p-2 mb-3"
      >
        <option value="">Sélectionner un produit</option>
        {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
      </select>

      <input
        type="number"
        min={1}
        value={quantite}
        onChange={(e) => setQuantite(Number(e.target.value))}
        className="w-full border border-gray-300 rounded p-2 mb-4"
        placeholder="Quantité"
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-mamastockGold text-white py-2 rounded hover:bg-mamastockGoldHover transition"
      >
        Créer réquisition
      </button>
    </div>
  );
}
