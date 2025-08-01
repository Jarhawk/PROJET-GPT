// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/produits/ProduitForm.jsx
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useFamilles } from "@/hooks/useFamilles";
import { useUnites } from "@/hooks/useUnites";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import SecondaryButton from "@/components/ui/SecondaryButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import GlassCard from "@/components/ui/GlassCard";
import { Card, CardContent } from "@/components/ui/card";

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
  const [stock_reel, setStockReel] = useState(produit?.stock_reel || 0);
  const [stock_min, setStockMin] = useState(produit?.stock_min || 0);
  const [actif, setActif] = useState(produit?.actif ?? true);
  const [code, setCode] = useState(produit?.code || "");
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
      setStockReel(produit.stock_reel || 0);
      setStockMin(produit.stock_min || 0);
      setActif(produit.actif ?? true);
      setCode(produit.code || "");
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
      stock_reel: Number(stock_reel),
      stock_min: Number(stock_min),
      actif,
      code,
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bloc 1: Informations générales */}
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg text-white">
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="prod-nom"
                className="text-white text-sm font-semibold mb-1 block"
              >
                Nom *
              </label>
              <Input
                id="prod-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
              {errors.nom && (
                <p className="text-red-500 text-sm">{errors.nom}</p>
              )}
            </div>
            <div>
              <label className="text-white text-sm font-semibold mb-1 block">
                Famille *
              </label>
              <Select
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
              </Select>
              {errors.famille && (
                <p className="text-red-500 text-sm">{errors.famille}</p>
              )}
            </div>
            <div>
              <label className="text-white text-sm font-semibold mb-1 block">
                Unité *
              </label>
              <Select
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
              </Select>
              {errors.unite && (
                <p className="text-red-500 text-sm">{errors.unite}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="prod-code"
                className="text-white text-sm font-semibold mb-1 block"
              >
                Code interne
              </label>
              <Input
                id="prod-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="prod-allerg"
                className="text-white text-sm font-semibold mb-1 block"
              >
                Allergènes
              </label>
              <Input
                id="prod-allerg"
                value={allergenes}
                onChange={(e) => setAllergenes(e.target.value)}
                placeholder="Ex: gluten, lait"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-white text-sm font-semibold mb-1 block">
                Photo
              </label>
              <input
                id="prod-photo"
                type="file"
                accept="image/*"
                disabled
                className="w-full text-white/70"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloc 2: Stock & prix */}
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg text-white">
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editing && (
              <div>
                <label className="text-white text-sm font-semibold mb-1 block">
                  PMP (€)
                </label>
                <Input
                  type="number"
                  className="w-full"
                  value={produit?.pmp || 0}
                  readOnly
                  disabled
                />
              </div>
            )}
            <div>
              <label className="text-white text-sm font-semibold mb-1 block">
                Stock réel
              </label>
              <Input
                type="number"
                value={stock_reel}
                onChange={(e) => setStockReel(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label
                htmlFor="prod-min"
                className="text-white text-sm font-semibold mb-1 block"
              >
                Stock minimum
              </label>
              <Input
                id="prod-min"
                type="number"
                value={stock_min}
                onChange={(e) => setStockMin(e.target.value)}
                min={0}
              />
            </div>
            <label className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={actif}
                onChange={(e) => setActif(e.target.checked)}
                id="prod-actif"
                className="accent-white"
              />
              Produit actif
            </label>
          </CardContent>
        </Card>

        {/* Bloc 3: Fournisseurs */}
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg text-white">
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="prod-fournisseur"
                className="text-white text-sm font-semibold mb-1 block"
              >
                Fournisseur principal
              </label>
              <Select
                id="prod-fournisseur"
                value={fournisseurId}
                onChange={(e) => setFournisseurId(e.target.value)}
                className="w-full"
              >
                <option value="">Aucun</option>
                {fournisseurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bloc 4: Actions */}
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg text-white">
          <CardContent className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={onClose}>
              Annuler
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={loading || saving}
              className="flex items-center gap-2"
            >
              {(loading || saving) && <span className="loader-glass" />}
              {editing ? "Enregistrer" : "Créer"}
            </PrimaryButton>
          </CardContent>
        </Card>
      </form>
    </GlassCard>
  );
}
