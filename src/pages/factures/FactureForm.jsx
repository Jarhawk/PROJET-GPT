// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import { useFactures } from "@/hooks/useFactures";
import { useProduitsAutocomplete } from "@/hooks/useProduitsAutocomplete";
import { useFournisseursAutocomplete } from "@/hooks/useFournisseursAutocomplete";
import { useFactureForm } from "@/hooks/useFactureForm";
import { useProducts } from "@/hooks/useProducts";
import GlassCard from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import { Button } from "@/components/ui/button";
import FactureLigne from "@/components/FactureLigne";
import toast from "react-hot-toast";

export default function FactureForm({ facture = null, fournisseurs = [], onClose, onSaved }) {
  const { createFacture, updateFacture, addLigneFacture, calculateTotals } = useFactures();
  const { updateProduct } = useProducts();
  const { results: fournisseurOptions, searchFournisseurs } = useFournisseursAutocomplete();
  const { results: produitOptions, searchProduits } = useProduitsAutocomplete();
  const { mama_id } = useAuth();
  const formRef = useRef(null);

  const [date, setDate] = useState(
    facture?.date_facture || new Date().toISOString().slice(0, 10),
  );
  const [fournisseur_id, setFournisseurId] = useState(facture?.fournisseur_id || "");
  const [numero, setNumero] = useState(facture?.numero || "");
  const [numeroUsed, setNumeroUsed] = useState(false);
  const [statut, setStatut] = useState(facture?.statut || "brouillon");
  const [lignes, setLignes] = useState(() =>
    facture?.lignes?.map(l => ({
      ...l,
      produit_nom: l.produit?.nom || "",
      unite: l.produit?.unite || "",
      majProduit: false,
      zone_stock_id: l.zone_stock_id || "",
    })) || [
      {
        produit_id: "",
        produit_nom: "",
        unite: "",
        quantite: 1,
        prix_unitaire: 0,
        tva: 20,
        majProduit: false,
        zone_stock_id: "",
      },
    ],
  );
  const [commentaire, setCommentaire] = useState(facture?.commentaire || "");
  const { autoHt, autoTva, autoTotal } = useFactureForm(lignes);
  const ecart = facture ? facture.total_ht - autoHt : 0;

  useEffect(() => {
    if (facture?.fournisseur_id && fournisseurs.length) {
      const found = fournisseurs.find(f => f.id === facture.fournisseur_id);
      searchFournisseurs(found?.nom || "");
    } else {
      searchFournisseurs("");
    }
  }, [facture?.fournisseur_id, fournisseurs, searchFournisseurs]);

  useEffect(() => {
    const checkNumero = async () => {
      if (!numero) { setNumeroUsed(false); return; }
      const { data } = await supabase
        .from("factures")
        .select("id")
        .eq("mama_id", mama_id)
        .eq("numero", numero)
        .neq("id", facture?.id || 0)
        .maybeSingle();
      setNumeroUsed(!!data);
    };
    checkNumero();
  }, [numero, mama_id, facture?.id]);

  const ecartClass = Math.abs(ecart) > 0.01 ? "text-red-500" : "text-green-500";

  const handleSubmit = async e => {
    e.preventDefault();
    if (numeroUsed) return toast.error("Numéro de facture déjà utilisé");
    if (!date || !fournisseur_id) {
      toast.error("Champs requis manquants !");
      formRef.current?.querySelector(":invalid")?.focus();
      return;
    }
    try {
      let fid = facture?.id;
      const invoice = {
        date_facture: date,
        fournisseur_id,
        numero,
        statut,
        total_ht: autoHt,
        total_tva: autoTva,
        total_ttc: autoTotal,
        commentaire,
      };
      if (fid) {
        await updateFacture(fid, invoice);
      } else {
        const { data, error } = await createFacture(invoice);
        if (error) throw error;
        fid = data.id;
      }
      for (let i = 0; i < lignes.length; i++) {
        const ligne = lignes[i];
        if (!ligne.produit_id) {
          toast.error("Produit requis pour chaque ligne");
          return;
        }
        const { produit_nom: _n, majProduit: _m, unite: _u, ...rest } = ligne;
        await addLigneFacture(fid, { ...rest, fournisseur_id });
        if (ligne.majProduit) {
          await updateProduct(
            ligne.produit_id,
            {
              dernier_prix: ligne.prix_unitaire,
              zone_stock_id: ligne.zone_stock_id,
              tva: ligne.tva,
            },
            { refresh: false },
          );
        }
      }
      await calculateTotals(fid);
      onSaved?.();
      toast.success(facture ? "Facture modifiée !" : "Facture ajoutée !");
      if (facture) {
        onClose?.();
      } else {
        const today = new Date().toISOString().slice(0, 10);
        setDate(today);
        setFournisseurId("");
        setNumero("");
        setNumeroUsed(false);
        setStatut("brouillon");
        setCommentaire("");
        setLignes([
          {
            produit_id: "",
            produit_nom: "",
            unite: "",
            quantite: 1,
            prix_unitaire: 0,
            tva: 20,
            majProduit: false,
            zone_stock_id: "",
          },
        ]);
        searchFournisseurs("");
      }
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    }
  };

  return (
    <GlassCard width="w-full" title={facture ? "Modifier la facture" : "Ajouter une facture"}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm mb-1">Date *</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">État</label>
            <Select value={statut} onChange={e => setStatut(e.target.value)}>
              <option value="brouillon">Brouillon</option>
              <option value="en attente">En attente</option>
              <option value="validée">Validée</option>
              <option value="archivée">Archivée</option>
            </Select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Numéro *</label>
            <Input
              type="text"
              value={numero}
              onChange={e => setNumero(e.target.value)}
              className={numeroUsed ? "border-red-500" : ""}
              required
            />
            {numeroUsed && <p className="text-xs text-red-500">Numéro déjà existant</p>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Total HT</label>
            <Input
              type="text"
              readOnly
              value={autoHt.toFixed(2)}
              className="font-bold [appearance:textfield]"
            />
          </div>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm mb-1">Fournisseur *</label>
            <AutoCompleteField
              value={fournisseur_id}
              onChange={obj => {
                const val = obj?.nom || "";
                setFournisseurId(obj?.id || "");
                if (!obj?.id && val.length >= 2) searchFournisseurs(val);
              }}
              options={fournisseurOptions}
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Commentaire</label>
            <Input type="text" value={commentaire} onChange={e => setCommentaire(e.target.value)} />
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-2">Lignes produits</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Qté</th>
                  <th>Unité</th>
                  <th>PU</th>
                  <th>TVA</th>
                  <th>Zone</th>
                  <th>MAJ produit</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, idx) => (
                  <FactureLigne
                    key={idx}
                    index={idx}
                    ligne={l}
                    produitOptions={produitOptions}
                    searchProduits={searchProduits}
                    onChange={ligne => {
                      setLignes(ls => {
                        const newLs = ls.map((it, i) => (i === idx ? ligne : it));
                        const ids = newLs.map(li => li.produit_id).filter(Boolean);
                        const hasDup = ids.some((id, i) => ids.indexOf(id) !== i);
                        if (hasDup) toast.error("Produit déjà ajouté");
                        return newLs;
                      });
                    }}
                    onRemove={i => setLignes(ls => ls.filter((_, j) => j !== i))}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            className="mt-4"
            onClick={() =>
              setLignes(ls => [
                ...ls,
                {
                  produit_id: "",
                  produit_nom: "",
                  unite: "",
                  quantite: 1,
                  prix_unitaire: 0,
                  tva: 20,
                  majProduit: false,
                  zone_stock_id: "",
                },
              ])
            }
          >
            Ajouter ligne
          </Button>
        </section>

        <section className="p-2 bg-white/10 backdrop-blur-xl rounded border border-white/20">
          <span className="font-bold">Total HT: {autoHt.toFixed(2)} €</span> -
          <span className="font-bold">TVA: {autoTva.toFixed(2)} €</span> -
          <span className="font-bold">TTC: {autoTotal.toFixed(2)} €</span> -
          <span className={`ml-2 font-bold ${ecartClass}`}>Écart HT: {ecart.toFixed(2)} €</span>
        </section>

        <div className="flex gap-2 mt-4">
          <Button type="submit" variant="primary" className="min-w-[120px]" disabled={numeroUsed}>
            {facture ? "Modifier" : "Ajouter"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
