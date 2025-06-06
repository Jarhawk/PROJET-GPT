// src/pages/comparatif/ComparatifPrix.jsx
import { useEffect, useState } from "react";
import PrixFournisseurs from "./PrixFournisseurs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function ComparatifPrix() {
  const { mama_id } = useAuth();
  const [produits, setProduits] = useState([]);
  const [produitId, setProduitId] = useState("");

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, nom")
          .eq("mama_id", mama_id)
          .order("nom", { ascending: true });

        if (error) throw error;
        setProduits(data || []);
      } catch (err) {
        console.error("Erreur chargement produits :", err.message);
        setProduits([]);
      }
    };

    if (mama_id) fetchProduits();
  }, [mama_id]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📊 Comparatif fournisseurs par produit</h2>

      <label htmlFor="produit-select" className="block font-semibold mb-1">
        Sélectionner un produit
      </label>
      <select
        id="produit-select"
        value={produitId}
        onChange={(e) => setProduitId(e.target.value)}
        className="border px-3 py-2 rounded w-full mb-4"
        aria-label="Sélection produit"
      >
        <option value="">-- Choisir un produit --</option>
        {produits.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nom}
          </option>
        ))}
      </select>

      {produitId && <PrixFournisseurs produitId={produitId} />}
    </div>
  );
}
