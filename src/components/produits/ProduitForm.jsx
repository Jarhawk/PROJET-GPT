// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/produits/ProduitForm.jsx
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useFamilles } from "@/hooks/useFamilles";
import { useUnites } from "@/hooks/useUnites";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { toast } from "react-hot-toast";
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

export default function ProduitForm({ produit, familles = [], unites = [], onSuccess, onClose }) {
  const editing = !!produit;
  const { familles: famillesHook, fetchFamilles, addFamille } = useFamilles();
  const { unites: unitesHook, fetchUnites, addUnite } = useUnites();
  const { fournisseurs, fetchFournisseurs } = useFournisseurs();

  const [nom, setNom] = useState(produit?.nom || "");
  const [familleId, setFamilleId] = useState(produit?.famille_id || "");
  const [uniteId, setUniteId] = useState(produit?.unite_id || "");
  // Utilise la colonne fournisseur_id définie dans le schéma SQL // ✅ Correction Codex
  const [fournisseurId, setFournisseurId] = useState(produit?.fournisseur_id || ""); // ✅ Correction Codex
  const [stock_reel, setStockReel] = useState(produit?.stock_reel || 0);
  const [stock_min, setStockMin] = useState(produit?.stock_min || 0);
  const [actif, setActif] = useState(produit?.actif ?? true);
  const [code, setCode] = useState(produit?.code || "");
  const [allergenes, setAllergenes] = useState(produit?.allergenes || "");
  const [_image, setImage] = useState(null); // ✅ Correction Codex
  const [errors, setErrors] = useState({});

  const { addProduct, updateProduct, loading } = useProducts();
  const [saving, setSaving] = useState(false);

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
      setFournisseurId(produit.fournisseur_id || ""); // ✅ Correction Codex
      setStockReel(produit.stock_reel || 0);
      setStockMin(produit.stock_min || 0);
      setActif(produit.actif ?? true);
      setCode(produit.code || "");
      setAllergenes(produit.allergenes || ""); // ✅ Correction Codex
    }
  }, [editing, produit]);

  const handleSubmit = async e => {
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
    const newProd = {
      nom,
      famille_id: familleId || null,
      unite_id: uniteId || null,
      fournisseur_id: fournisseurId || null, // ✅ Correction Codex
      stock_reel: Number(stock_reel),
      stock_min: Number(stock_min),
      actif,
      code,
      allergenes,
    };
    try {
      setSaving(true);
      if (editing) {
        const res = await updateProduct(produit.id, newProd, { refresh: false });
        if (res?.error) throw res.error;
        toast.success("Produit mis à jour !");
      } else {
        const res = await addProduct(newProd, { refresh: false });
        if (res?.error) throw res.error;
        toast.success("Produit ajouté !");
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Erreur enregistrement produit:", err);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  async function handleUpload() { // ✅ Correction Codex
    toast.error("Upload désactivé");
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold mb-2 text-mamastockGold">
        {editing ? "Éditer le produit" : "Nouveau produit"}
      </h2>
      <div>
        <label className="block text-sm mb-1 font-medium" htmlFor="prod-nom">Nom</label>
        <Input
          id="prod-nom"
          value={nom}
          onChange={e => setNom(e.target.value)}
          required
        />
        {errors.nom && <p className="text-red-500 text-sm">{errors.nom}</p>}
      </div>
      <AutoCompleteField
        label="Famille"
        value={familleId}
        onChange={setFamilleId}
        options={[...famillesHook, ...familles].map(f => ({ value: f.id, label: f.nom }))}
        onAddOption={async val => {
          const { data, error } = await addFamille(val);
          if (error) toast.error(error.message || error);
          else return { id: data.id, label: data.nom };
        }}
        required
      />
      {errors.famille && <p className="text-red-500 text-sm">{errors.famille}</p>}
      <AutoCompleteField
        label="Unité"
        value={uniteId}
        onChange={setUniteId}
        options={[...unitesHook, ...unites].map(u => ({ value: u.id, label: u.nom }))}
        onAddOption={async val => {
          const { data, error } = await addUnite(val);
          if (error) toast.error(error.message || error);
          else return { id: data.id, label: data.nom };
        }}
        required
      />
      {errors.unite && <p className="text-red-500 text-sm">{errors.unite}</p>}
      <div>
        <label className="block text-sm mb-1 font-medium" htmlFor="prod-fournisseur">Fournisseur principal</label> // ✅ Correction Codex
        <Select
          id="prod-fournisseur" // ✅ Correction Codex
          value={fournisseurId} // ✅ Correction Codex
          onChange={e => setFournisseurId(e.target.value)} // ✅ Correction Codex
          className="w-full"
        >
          <option value="">Aucun</option>
          {fournisseurs.map(f => (
            <option key={f.id} value={f.id}>{f.nom}</option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="prod-code" className="block text-sm mb-1 font-medium">Code interne</label>
        <Input id="prod-code" value={code} onChange={e => setCode(e.target.value)} />
      </div>
      <div>
        <label htmlFor="prod-allerg" className="block text-sm mb-1 font-medium">Allergènes</label>
        <Input
          id="prod-allerg"
          value={allergenes}
          onChange={e => setAllergenes(e.target.value)}
          placeholder="Ex: gluten, lait"
        />
      </div>
      <div>
        <label className="block text-sm mb-1 font-medium">Photo</label>
        <input
          id="prod-photo"
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files[0])}
        />
        <button type="button" className="btn btn-secondary mt-1" onClick={handleUpload}>
          Upload
        </button>
      </div>
      {editing && (
        <div>
          <label className="block text-sm mb-1 font-medium">PMP (€)</label>
          <Input
            type="number"
            className="w-28"
            value={produit?.pmp || 0}
            readOnly
            disabled
          />
        </div>
      )}
      <div>
        <label className="block text-sm mb-1 font-medium">Stock réel</label>
        <Input
          type="number"
          className="w-28"
          value={stock_reel}
          onChange={e => setStockReel(e.target.value)}
          min={0}
        />
      </div>
      <div>
        <label htmlFor="prod-min" className="block text-sm mb-1 font-medium">Stock minimum</label>
        <Input
          id="prod-min"
          type="number"
          className="w-28"
          value={stock_min}
          onChange={e => setStockMin(e.target.value)}
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
        <SecondaryButton type="button" onClick={onClose}>Annuler</SecondaryButton>
        <PrimaryButton type="submit" disabled={loading || saving} className="flex items-center gap-2">
          {(loading || saving) && <span className="loader-glass" />}
          {editing ? "Enregistrer" : "Créer"}
        </PrimaryButton>
      </div>
    </form>
  );
}
