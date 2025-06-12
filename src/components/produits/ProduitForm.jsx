// src/components/produits/ProduitForm.jsx
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "react-hot-toast";

export default function ProduitForm({ produit, familles, unites, onSuccess, onClose }) {
  const editing = !!produit;
  const [nom, setNom] = useState(produit?.nom || "");
  const [famille, setFamille] = useState(produit?.famille || "");
  const [unite, setUnite] = useState(produit?.unite || "");
  const [pmp, setPmp] = useState(produit?.pmp || "");
  const [stock_reel, setStockReel] = useState(produit?.stock_reel || 0);
  const [actif, setActif] = useState(produit?.actif ?? true);

  const { addProduct, updateProduct, loading } = useProducts();

  useEffect(() => {
    if (editing && produit) {
      setNom(produit.nom || "");
      setFamille(produit.famille || "");
      setUnite(produit.unite || "");
      setPmp(produit.pmp || "");
      setStockReel(produit.stock_reel || 0);
      setActif(produit.actif ?? true);
    }
  }, [editing, produit]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!nom || !famille || !unite) {
      toast.error("Tous les champs sont obligatoires.");
      return;
    }
    const newProd = { nom, famille, unite, pmp: Number(pmp), stock_reel: Number(stock_reel), actif };
    if (editing) {
      await updateProduct(produit.id, newProd);
      toast.success("Produit mis à jour !");
    } else {
      await addProduct(newProd);
      toast.success("Produit ajouté !");
    }
    onSuccess?.();
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-4">
      <h2 className="text-xl font-bold mb-2 text-mamastockGold">
        {editing ? "Éditer le produit" : "Nouveau produit"}
      </h2>
      <div>
        <label className="block text-sm mb-1 font-medium">Nom</label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={nom}
          onChange={e => setNom(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm mb-1 font-medium">Famille</label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={famille}
          onChange={e => setFamille(e.target.value)}
          list="famille-list"
          required
        />
        <datalist id="famille-list">
          {(familles || []).map(f => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="block text-sm mb-1 font-medium">Unité</label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={unite}
          onChange={e => setUnite(e.target.value)}
          list="unite-list"
          required
        />
        <datalist id="unite-list">
          {(unites || []).map(u => (
            <option key={u} value={u} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="block text-sm mb-1 font-medium">PMP (€)</label>
        <input
          type="number"
          className="input input-bordered w-28"
          value={pmp}
          onChange={e => setPmp(e.target.value)}
          min={0}
          step="0.01"
        />
      </div>
      <div>
        <label className="block text-sm mb-1 font-medium">Stock réel</label>
        <input
          type="number"
          className="input input-bordered w-28"
          value={stock_reel}
          onChange={e => setStockReel(e.target.value)}
          min={0}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={actif}
          onChange={e => setActif(e.target.checked)}
          id="prod-actif"
        />
        <label htmlFor="prod-actif" className="text-sm">Produit actif</label>
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <button type="button" onClick={onClose} className="btn">Annuler</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {editing ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </form>
  );
}
