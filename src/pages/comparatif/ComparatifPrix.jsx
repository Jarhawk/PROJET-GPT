// src/pages/comparatif/ComparatifPrix.jsx
import { useState } from "react";
import PrixFournisseurs from "./PrixFournisseurs";
import { useProducts } from "@/hooks/useProducts";

export default function ComparatifPrix() {
  const { products } = useProducts();
  const [produitId, setProduitId] = useState("");

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
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nom}
          </option>
        ))}
      </select>

      {produitId && <PrixFournisseurs produitId={produitId} />}
    </div>
  );
}
