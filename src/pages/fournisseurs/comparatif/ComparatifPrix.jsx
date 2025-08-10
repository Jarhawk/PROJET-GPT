// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/pages/fournisseurs/comparatif/ComparatifPrix.jsx
import { useEffect, useState } from "react";
import PrixFournisseurs from "./PrixFournisseurs";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Select } from "@/components/ui/select";

export default function ComparatifPrix() {
  const { mama_id } = useAuth();
  const [produits, setProduits] = useState([]);
  const [produitId, setProduitId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduits = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("produits")
          .select("id, nom")
          .eq("mama_id", mama_id)
          .order("nom", { ascending: true });

        if (error) throw error;
        setProduits(data || []);
      } catch (err) {
        console.error("Erreur chargement produits :", err.message);
        setError(err);
        setProduits([]);
      } finally {
        setLoading(false);
      }
    };

    if (mama_id) fetchProduits();
  }, [mama_id]);

  if (loading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📊 Comparatif fournisseurs par produit</h2>

      <label htmlFor="produit-select" className="block font-semibold mb-1">
        Sélectionner un produit
      </label>
      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 text-sm mb-2">
          {error.message || "Erreur de chargement"}
        </p>
      )}
      <Select
        id="produit-select"
        value={produitId}
        onChange={(e) => setProduitId(e.target.value)}
        className="mb-4"
        ariaLabel="Sélection produit"
      >
        <option value="">-- Choisir un produit --</option>
        {produits.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nom}
          </option>
        ))}
      </Select>

      {produitId && <PrixFournisseurs produitId={produitId} />}
    </div>
  );
}
