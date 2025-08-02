// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/produits/ProduitForm.jsx
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useFamilles } from "@/hooks/useFamilles";
import { useUnites } from "@/hooks/useUnites";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { toast } from "react-hot-toast";
import GlassCard from "@/components/ui/GlassCard";

export default function ProduitForm({
  produit,
  onSuccess,
  onClose,
}) {
  const editing = !!produit;
  const { fournisseurs, fetchFournisseurs } = useFournisseurs();
  const { familles, fetchFamilles } = useFamilles();
  const { unites, fetchUnites } = useUnites();

  const [nom, setNom] = useState(produit?.nom || "");
  const [familleId, setFamilleId] = useState(produit?.famille_id || "");
  const [uniteId, setUniteId] = useState(produit?.unite_id || "");
  const [fournisseurId, setFournisseurId] = useState(
    produit?.fournisseur_id || "",
  );
  const [stockMin, setStockMin] = useState(produit?.stock_min || 0);
  const [actif, setActif] = useState(produit?.actif ?? true);
  const [allergenes, setAllergenes] = useState(produit?.allergenes || "");
  const [errors, setErrors] = useState({});

  const { addProduct, updateProduct, loading } = useProducts();
  const [saving, setSaving] = useState(false);

  const familleOptions = [...familles]
    .filter((f, idx, arr) => arr.findIndex((ff) => ff.id === f.id) === idx)
    .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));

  const uniteOptions = [...unites]
    .filter((u, idx, arr) => arr.findIndex((uu) => uu.id === u.id) === idx)
    .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));

  useEffect(() => {
    fetchFamilles();
    fetchUnites();
    fetchFournisseurs();
  }, [fetchFamilles, fetchUnites, fetchFournisseurs]);

  useEffect(() => {
    if (editing && produit) {
      setNom(produit.nom || "");
      setFamilleId(produit.famille_id || "");
      setUniteId(produit.unite_id || "");
      setFournisseurId(produit.fournisseur_id || "");
      setStockMin(produit.stock_min || 0);
      setActif(produit.actif ?? true);
      setAllergenes(produit.allergenes || "");
    }
  }, [editing, produit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const errs = {};
    if (!nom.trim()) errs.nom = "Nom requis";
    if (!familleId) errs.famille = "Famille requise";
    if (!uniteId) errs.unite = "Unité requise";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }
    const familleIdVal = familleId;
    const uniteIdVal = uniteId;

    const newProd = {
      nom,
      famille_id: familleIdVal || null,
      unite_id: uniteIdVal || null,
      fournisseur_id: fournisseurId || null,
      stock_min: Number(stockMin),
      actif,
      allergenes,
    };
    let toastId;
    try {
      setSaving(true);
      toastId = toast.loading(editing ? "Mise à jour..." : "Enregistrement...");
      if (editing) {
        const res = await updateProduct(produit.id, newProd, {
          refresh: false,
        });
        if (res?.error) throw res.error;
        toast.success("Produit mis à jour !", { id: toastId });
      } else {
        const res = await addProduct(newProd, { refresh: false });
        if (res?.error) throw res.error;
        toast.success("Produit ajouté !", { id: toastId });
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Erreur enregistrement produit:", err);
      toast.error("Erreur lors de l'enregistrement.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-4">
        Créer ou modifier un produit
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {/* Groupe 1 : nom, famille, unité */}
        <div className="flex flex-col gap-1 p-2 rounded-xl">
          <label htmlFor="prod-nom" className="label text-white">
            Nom *
          </label>
          <input
            id="prod-nom"
            className="input"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du produit"
            required
          />
          {errors.nom && <p className="text-red-500 text-sm">{errors.nom}</p>}
        </div>
        <div className="flex flex-col gap-1 p-2 rounded-xl">
          <label htmlFor="prod-famille" className="label text-white">
            Famille *
          </label>
          <select
            id="prod-famille"
            className="input bg-white text-gray-900"
            value={familleId}
            onChange={(e) => setFamilleId(e.target.value)}
            required
          >
            <option value="">-- Choisir --</option>
            {familleOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
          {errors.famille && (
            <p className="text-red-500 text-sm">{errors.famille}</p>
          )}
        </div>
        <div className="flex flex-col gap-1 p-2 rounded-xl">
          <label htmlFor="prod-unite" className="label text-white">
            Unité *
          </label>
          <select
            id="prod-unite"
            className="input bg-white text-gray-900"
            value={uniteId}
            onChange={(e) => setUniteId(e.target.value)}
            required
          >
            <option value="">-- Choisir --</option>
            {uniteOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nom}
              </option>
            ))}
          </select>
          {errors.unite && <p className="text-red-500 text-sm">{errors.unite}</p>}
        </div>

        {/* Groupe 2 : allergènes */}
        <div className="flex flex-col gap-1 p-2 rounded-xl">
          <label htmlFor="prod-allerg" className="label text-white">
            Allergènes
          </label>
          <input
            id="prod-allerg"
            className="input"
            value={allergenes}
            onChange={(e) => setAllergenes(e.target.value)}
            placeholder="Ex: gluten, lait"
          />
        </div>
        {/* Groupe 3 : stock minimum, actif */}
        <div className="flex flex-col gap-1 p-2 rounded-xl">
          <label htmlFor="prod-min" className="label text-white">
            Stock minimum
          </label>
          <input
            id="prod-min"
            type="number"
            className="input"
            value={stockMin}
            onChange={(e) => setStockMin(e.target.value)}
            min={0}
          />
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl">
          <input
            type="checkbox"
            id="prod-actif"
            checked={actif}
            onChange={(e) => setActif(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="prod-actif" className="label text-white m-0">
            Produit actif
          </label>
        </div>

        {/* Groupe 4 : fournisseur principal */}
        <div className="flex flex-col gap-1 p-2 rounded-xl">
          <label htmlFor="prod-fournisseur" className="label text-white">
            Fournisseur principal
          </label>
          <select
            id="prod-fournisseur"
            className="input bg-white text-gray-900"
            value={fournisseurId}
            onChange={(e) => setFournisseurId(e.target.value)}
          >
            <option value="">Aucun</option>
            {fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-2 rounded-xl">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || saving}
            className="btn btn-primary flex items-center gap-2"
          >
            {(loading || saving) && <span className="loader-glass" />}
            {editing ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}
