// src/components/produits/ProduitForm.jsx
// ✅ Vérifié
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useFamilles } from "@/hooks/useFamilles";
import { useUnites } from "@/hooks/useUnites";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { toast } from "react-hot-toast";
import { uploadFile, deleteFile, pathFromUrl } from "@/hooks/useStorage";
import AutoCompleteField from "@/components/ui/AutoCompleteField";

export default function ProduitForm({ produit, familles = [], unites = [], onSuccess, onClose }) {
  const editing = !!produit;
  const { familles: famillesHook, fetchFamilles, addFamille } = useFamilles();
  const { unites: unitesHook, fetchUnites, addUnite } = useUnites();
  const { fournisseurs, fetchFournisseurs } = useFournisseurs();

  const [nom, setNom] = useState(produit?.nom || "");
  const [famille, setFamille] = useState(produit?.famille || "");
  const [unite, setUnite] = useState(produit?.unite || "");
  const [mainSupplierId, setMainSupplierId] = useState(produit?.main_supplier_id || "");
  const [pmp, setPmp] = useState(produit?.pmp || "");
  const [stock_reel, setStockReel] = useState(produit?.stock_reel || 0);
  const [stock_min, setStockMin] = useState(produit?.stock_min || 0);
  const [actif, setActif] = useState(produit?.actif ?? true);
  const [code, setCode] = useState(produit?.code || "");
  const [allergenes, setAllergenes] = useState(produit?.allergenes || "");
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(produit?.image || "");
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
      setFamille(produit.famille || "");
      setUnite(produit.unite || "");
      setMainSupplierId(produit.main_supplier_id || "");
      setPmp(produit.pmp || "");
      setStockReel(produit.stock_reel || 0);
      setStockMin(produit.stock_min || 0);
      setActif(produit.actif ?? true);
      setCode(produit.code || "");
      setAllergenes(produit.allergenes || "");
      setImageUrl(produit.image || "");
    }
  }, [editing, produit]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (saving) return;
    const errs = {};
    if (!nom.trim()) errs.nom = "Nom requis";
    if (!famille.trim()) errs.famille = "Famille requise";
    if (!unite.trim()) errs.unite = "Unité requise";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }
    const newProd = {
      nom,
      famille,
      unite,
      main_supplier_id: mainSupplierId || null,
      pmp: Number(pmp),
      stock_reel: Number(stock_reel),
      stock_min: Number(stock_min),
      actif,
      code,
      allergenes,
      image: imageUrl || produit?.image,
    };
    console.log("DEBUG form", newProd);
    try {
      setSaving(true);
      if (editing) {
        const res = await updateProduct(produit.id, newProd);
        if (res?.error) throw res.error;
        toast.success("Produit mis à jour !");
      } else {
        const res = await addProduct(newProd);
        if (res?.error) throw res.error;
        toast.success("Produit ajouté !");
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.log("DEBUG error", err);
      console.error("Erreur enregistrement produit:", err);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  async function handleUpload() {
    if (!image) return toast.error("Sélectionnez une image");
    try {
      if (imageUrl) await deleteFile("products", pathFromUrl(imageUrl));
      const url = await uploadFile("products", image);
      setImageUrl(url);
      toast.success("Image uploadée !");
    } catch (err) {
      console.error(err);
      toast.error("Échec upload");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-4 animate-fade-in">
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
        {errors.nom && <p className="text-red-500 text-sm">{errors.nom}</p>}
      </div>
      <AutoCompleteField
        label="Famille"
        value={famille}
        onChange={setFamille}
        options={[...famillesHook.map(f => f.nom), ...familles]}
        onAddOption={async val => {
          const { error } = await addFamille(val);
          if (error) toast.error(error.message || error);
        }}
        required
      />
      {errors.famille && <p className="text-red-500 text-sm">{errors.famille}</p>}
      <AutoCompleteField
        label="Unité"
        value={unite}
        onChange={setUnite}
        options={[...unitesHook.map(u => u.nom), ...unites]}
        onAddOption={async val => {
          const { error } = await addUnite(val);
          if (error) toast.error(error.message || error);
        }}
        required
      />
      {errors.unite && <p className="text-red-500 text-sm">{errors.unite}</p>}
      <div>
        <label className="block text-sm mb-1 font-medium">Fournisseur principal</label>
        <select
          className="input input-bordered w-full"
          value={mainSupplierId}
          onChange={e => setMainSupplierId(e.target.value)}
        >
          <option value="">Aucun</option>
          {fournisseurs.map(f => (
            <option key={f.id} value={f.id}>{f.nom}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="prod-code" className="block text-sm mb-1 font-medium">Code interne</label>
        <input
          id="prod-code"
          type="text"
          className="input input-bordered w-full"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="prod-allerg" className="block text-sm mb-1 font-medium">Allergènes</label>
        <input
          id="prod-allerg"
          type="text"
          className="input input-bordered w-full"
          value={allergenes}
          onChange={e => setAllergenes(e.target.value)}
          placeholder="Ex: gluten, lait"
        />
      </div>
      <div>
        <label htmlFor="prod-photo" className="block text-sm mb-1 font-medium">Photo</label>
        {imageUrl && (
          <img src={imageUrl} alt="aperçu" className="h-20 mb-2 rounded" />
        )}
        <input
          id="prod-photo"
          type="file"
          accept="image/*"
          onChange={e => setImage(e.target.files[0])}
        />
        <button
          type="button"
          className="btn btn-secondary mt-1"
          onClick={handleUpload}
        >
          Upload
        </button>
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
      <div>
        <label htmlFor="prod-min" className="block text-sm mb-1 font-medium">Stock minimum</label>
        <input
          id="prod-min"
          type="number"
          className="input input-bordered w-28"
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
        <button type="button" onClick={onClose} className="btn">Annuler</button>
        <button type="submit" disabled={loading || saving} className="btn btn-primary">
          {editing ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </form>
  );
}
