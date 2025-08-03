// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import { useFactures } from "@/hooks/useFactures";
import { useProduitsAutocomplete } from "@/hooks/useProduitsAutocomplete";
import { useFournisseursAutocomplete } from "@/hooks/useFournisseursAutocomplete";
import { useFactureForm } from "@/hooks/useFactureForm";
import GlassCard from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Button } from "@/components/ui/button";
import FactureLigne from "@/components/FactureLigne";
import toast from "react-hot-toast";

export default function FactureForm({ facture = null, fournisseurs = [], onClose }) {
  const { createFacture, updateFacture, addLigneFacture, calculateTotals } = useFactures();
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
  const [totalHtInput, setTotalHtInput] = useState(
    facture?.total_ht ? String(facture.total_ht) : "",
  );
  const [commentaire, setCommentaire] = useState(facture?.commentaire || "");
  const { autoHt, autoTva, autoTotal, ecart } = useFactureForm(lignes, totalHtInput);

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

  const ecartClass = Math.abs(ecart) > 0.01 ? "text-red-500 font-semibold" : "text-green-500";

  const handleSubmit = async e => {
    e.preventDefault();
    if (numeroUsed) return toast.error("Numéro de facture déjà utilisé");
    if (!date || !fournisseur_id || !totalHtInput) {
      toast.error("Champs requis manquants !");
      formRef.current?.querySelector(":invalid")?.focus();
      return;
    }
    const diff = autoHt - Number(totalHtInput);
    let finalStatut = statut;
    if (Math.abs(diff) > 1) {
      finalStatut = "brouillon";
      toast.error("Total HT différent du calcul automatique. Facture enregistrée en brouillon.");
    }
    try {
      let fid = facture?.id;
      const invoice = {
        date_facture: date,
        fournisseur_id,
        numero,
        statut: finalStatut,
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
      }
      await calculateTotals(fid);
      toast.success(facture ? "Facture modifiée !" : "Facture ajoutée !");
      if (facture) {
        onClose?.();
      } else {
        // reset form for new entry
        setNumero("");
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
        setTotalHtInput("");
      }
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    }
  };

  return (
    <GlassCard className="p-6 w-full" title={facture ? "Modifier la facture" : "Ajouter une facture"}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-sm mb-1">Date *</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            <label className="block text-sm mb-1">Numéro *</label>
            <Input
              type="text"
              value={numero}
              onChange={e => setNumero(e.target.value)}
              className={numeroUsed ? "border-red-500" : ""}
              required
            />
            {numeroUsed && <p className="text-xs text-red-500">Numéro déjà existant</p>}
            <label className="block text-sm mb-1">Fournisseur *</label>
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
            <label className="block text-sm mb-1">Commentaire</label>
            <Input type="text" value={commentaire} onChange={e => setCommentaire(e.target.value)} />
          </div>
          <div className="space-y-4">
            <label className="block text-sm mb-1">Statut</label>
            <Select value={statut} onChange={e => setStatut(e.target.value)}>
              <option value="brouillon">Brouillon</option>
              <option value="en attente">En attente</option>
              <option value="validée">Validée</option>
              <option value="archivée">Archivée</option>
            </Select>
            <label className="block text-sm mb-1">Total HT *</label>
            <Input
              type="text"
              inputMode="decimal"
              value={totalHtInput}
              onChange={e => setTotalHtInput(e.target.value)}
              required
            />
            <p className={`text-xs mt-1 ${ecartClass}`} title="Écart entre total lignes et HT saisi">
              Écart : {ecart.toFixed(2)} €
            </p>
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
                  <th>TVA %</th>
                  <th>Zone</th>
                  <th>MAJ produit</th>
                  <th>HT</th>
                  <th>TVA</th>
                  <th>TTC</th>
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
          Total HT: {autoHt.toFixed(2)} € - TVA: {autoTva.toFixed(2)} € - TTC: {autoTotal.toFixed(2)} € -
          <span className={`ml-2 ${ecartClass}`}>Écart HT: {ecart.toFixed(2)} €</span>
        </section>

        <div className="flex gap-2 mt-4">
          <PrimaryButton type="submit" className="min-w-[120px]" disabled={numeroUsed}>
            {facture ? "Modifier" : "Ajouter"}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onClose}>
            Fermer
          </SecondaryButton>
        </div>
      </form>
    </GlassCard>
  );
}
