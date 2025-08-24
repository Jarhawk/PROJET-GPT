// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/produits/ProduitForm.jsx
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useFamilles } from "@/hooks/useFamilles";
import { useSousFamilles } from "@/hooks/useSousFamilles";
import { useUnites } from "@/hooks/useUnites";
import useFournisseurs from "@/hooks/data/useFournisseurs";
import useZonesStock from "@/hooks/useZonesStock";
import { toast } from 'sonner';
import GlassCard from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import { Badge } from "@/components/ui/badge";

export default function ProduitForm({
  produit,
  onSuccess,
  onClose,
}) {
  const editing = !!produit;
  const { data: fournisseursData } = useFournisseurs({ actif: true });
  const fournisseurs = fournisseursData?.data || [];
  const {
    familles: famillesData = [],
    fetchFamilles,
    error: famillesError,
  } = useFamilles();
  const {
    sousFamilles: sousFamillesData = [],
    list: listSousFamilles,
    loading: sousFamillesLoading,
    error: sousFamillesError,
  } = useSousFamilles();
  const { unites: unitesData = [], fetchUnites } = useUnites();
  const { zones = [] } = useZonesStock();

  const familles = Array.isArray(famillesData) ? famillesData : [];
  const sousFamilles = Array.isArray(sousFamillesData) ? sousFamillesData : [];
  const unites = Array.isArray(unitesData) ? unitesData : [];

  const [nom, setNom] = useState(produit?.nom || "");
  const [familleId, setFamilleId] = useState(produit?.famille_id || "");
  const [sousFamilleId, setSousFamilleId] = useState(
    produit?.sous_famille_id || "",
  );
  const [uniteId, setUniteId] = useState(produit?.unite_id || "");
  const [fournisseurId, setFournisseurId] = useState(
    produit?.fournisseur_id || "",
  );
  const [zoneStockId, setZoneStockId] = useState(produit?.zone_stock_id || "");
  const [stockMin, setStockMin] = useState(produit?.stock_min || 0);
  const [tva, setTva] = useState(produit?.tva ?? 0);
  const [actif, setActif] = useState(produit?.actif ?? true);
  const [allergenes, setAllergenes] = useState(produit?.allergenes || "");
  const [errors, setErrors] = useState({});

  const { addProduct, updateProduct, loading } = useProducts();
  const [saving, setSaving] = useState(false);

  const uniteOptions = [...unites]
    .filter((u, idx, arr) => arr.findIndex((uu) => uu.id === u.id) === idx)
    .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));

  useEffect(() => {
    fetchFamilles();
    fetchUnites();
  }, [fetchFamilles, fetchUnites]);

  const [familleHasSous, setFamilleHasSous] = useState(false);

  useEffect(() => {
    if (editing && produit?.famille_id) {
      listSousFamilles({ familleId: produit.famille_id, actif: true }).then(({ data }) => {
        setFamilleHasSous((data || []).length > 0);
      });
    }
  }, [editing, produit, listSousFamilles]);

  useEffect(() => {
    setSousFamilleId("");
    if (familleId) {
      listSousFamilles({ familleId, actif: true }).then(({ data }) => {
        setFamilleHasSous((data || []).length > 0);
      });
    } else {
      setFamilleHasSous(false);
    }
  }, [familleId, listSousFamilles]);

  useEffect(() => {
    if (editing && produit) {
      setNom(produit.nom || "");
      setFamilleId(produit.famille_id || "");
      setSousFamilleId(produit.sous_famille_id || "");
      setUniteId(produit.unite_id || "");
      setFournisseurId(produit.fournisseur_id || "");
      setZoneStockId(produit.zone_stock_id || "");
      setStockMin(produit.stock_min || 0);
      setTva(produit.tva ?? 0);
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
    if (familleHasSous && !sousFamilleId) errs.sousFamille = "Sous-famille requise";
    if (!uniteId) errs.unite = "Unité requise";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }

    const newProd = {
      nom,
      famille_id: familleId || null,
      sous_famille_id: sousFamilleId || null,
      unite_id: uniteId || null,
      fournisseur_id: fournisseurId || null,
      zone_stock_id: zoneStockId || null,
      stock_min: Number(stockMin),
      tva: tva === "" ? null : Number(tva),
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
        {/* Groupe 1 : nom, famille, sous-famille, unité */}
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
            {familles.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
          {errors.famille && (
            <p className="text-red-500 text-sm">{errors.famille}</p>
          )}
          {famillesError && (
            <p className="text-red-500 text-sm">Erreur chargement familles</p>
          )}
          {!famillesError && familles.length === 0 && (
            <p className="text-red-500 text-sm">Aucune famille disponible</p>
          )}
        </div>

        <div className="flex flex-col gap-1 p-2 rounded-xl">
          <label htmlFor="prod-sous-famille" className="label text-white">
            Sous-famille {familleHasSous ? '*' : ''}
          </label>
          <select
            id="prod-sous-famille"
            className="input bg-white text-gray-900"
            value={sousFamilleId}
            onChange={(e) => setSousFamilleId(e.target.value)}
            disabled={!familleId || sousFamillesLoading || !familleHasSous}
          >
            <option value="">
              {sousFamillesLoading ? "Chargement..." : "-- Choisir --"}
            </option>
            {sousFamilles.map((sf) => (
              <option key={sf.id} value={sf.id}>
                {sf.nom}
              </option>
            ))}
          </select>
          {errors.sousFamille && (
            <p role="alert" className="text-red-500 text-xs mt-1">
              {errors.sousFamille}
            </p>
          )}
          {sousFamillesError && (
            <p className="text-red-500 text-sm">Erreur chargement sous-familles</p>
          )}
          {!sousFamillesError &&
            familleId &&
            !sousFamillesLoading &&
            sousFamilles.length === 0 && (
              <p className="text-red-500 text-sm">Aucune sous-famille</p>
            )}
        </div>

        {familleId && (
          <div className="flex gap-2 p-2 rounded-xl">
            <Badge>
              {familles.find((f) => f.id === familleId)?.nom || ''}
            </Badge>
            {sousFamilleId && (
              <Badge>
                {sousFamilles.find((sf) => sf.id === sousFamilleId)?.nom || ''}
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1 p-2 rounded-xl">
          <AutoCompleteField
            label="Unité *"
            value={uniteId}
            onChange={(obj) => setUniteId(obj?.id || "")}
            options={uniteOptions}
            required
          />
          {errors.unite && <p className="text-red-500 text-sm">{errors.unite}</p>}
        </div>

        <div className="flex flex-col gap-1 p-2 rounded-xl">
          <label htmlFor="prod-zone" className="label text-white">
            Zone de stockage
          </label>
          <select
            id="prod-zone"
            className="input bg-white text-gray-900"
            value={zoneStockId}
            onChange={(e) => setZoneStockId(e.target.value)}
          >
            <option value="">Aucune</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nom}
              </option>
            ))}
          </select>
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
          <Input
            id="prod-min"
            type="number"
            value={stockMin ?? 0}
            onChange={(e) => setStockMin(Number(e.target.value) || 0)}
            min={0}
          />
        </div>
        <div className="flex flex-col gap-1 p-2 rounded-xl">
          <label htmlFor="prod-tva" className="label text-white">
            TVA (%)
          </label>
          <Input
            id="prod-tva"
            type="number"
            value={tva ?? 0}
            onChange={(e) => setTva(Number(e.target.value) || 0)}
            min={0}
            step="0.1"
          />
        </div>
        <div className="flex items-center gap-2 p-2 rounded-xl">
          <Checkbox
            id="prod-actif"
            checked={actif}
            onChange={(e) => setActif(e.target.checked)}
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
