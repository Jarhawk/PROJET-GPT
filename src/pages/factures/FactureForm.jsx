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
import { Button } from "@/components/ui/button";
import FactureLigne from "@/components/FactureLigne";
import toast from "react-hot-toast";
import { FACTURE_STATUTS } from "@/constants/factures";
import { Checkbox } from "@/components/ui/checkbox";

function safeParseJSON(val) {
  try {
    return typeof val === "string" ? JSON.parse(val) : val || [];
  } catch (e) {
    console.warn("Erreur parse JSON", e);
    return [];
  }
}

export default function FactureForm({ facture = null, fournisseurs = [], onClose, onSaved }) {
  const { createFacture, updateFacture, addLigneFacture } = useFactures();
  const { results: fournisseurOptions, searchFournisseurs } = useFournisseursAutocomplete();
  const { results: produitOptions, searchProduits } = useProduitsAutocomplete();
  const { mama_id } = useAuth();
  const formRef = useRef(null);

  const [date, setDate] = useState(
    facture?.date_facture || new Date().toISOString().slice(0, 10),
  );
  const [fournisseur_id, setFournisseurId] = useState(facture?.fournisseur_id || "");
  const [fournisseurNom, setFournisseurNom] = useState(facture?.fournisseur?.nom || "");
  const [isBonLivraison, setIsBonLivraison] = useState(Boolean(facture?.bon_livraison));
  const [numero, setNumero] = useState(facture?.numero || "");
  const [numeroUsed, setNumeroUsed] = useState(false);
  const [statut, setStatut] = useState(facture?.statut || "Brouillon");
  const [lignes, setLignes] = useState(() => {
    const initial = safeParseJSON(facture?.lignes_produits);
    return initial.length
      ? initial
      : [
          {
            produit_id: "",
            produit_nom: "",
            quantite: 1,
            total_ht: "",
            pu: "",
            tva: 20,
            zone_stock_id: "",
            unite_id: "",
            unite: "",
            pmp: null,
          },
        ];
  });
  const [totalHt, setTotalHt] = useState(
    facture?.total_ht !== undefined && facture?.total_ht !== null
      ? String(facture.total_ht)
      : ""
  );
  const { autoHt, autoTva, autoTotal } = useFactureForm(lignes);
  const ecart = (parseFloat(String(totalHt).replace(',', '.')) || 0) - autoHt;

  useEffect(() => {
    if (facture?.fournisseur_id && fournisseurs.length) {
      const found = fournisseurs.find(f => f.id === facture.fournisseur_id);
      setFournisseurNom(found?.nom || "");
      searchFournisseurs(found?.nom || "");
    } else {
      setFournisseurNom("");
      searchFournisseurs("");
    }
  }, [facture?.fournisseur_id, fournisseurs, searchFournisseurs]);

  useEffect(() => {
    const checkNumero = async () => {
      if (!numero) { setNumeroUsed(false); return; }
      try {
        const { data } = await supabase
          .from("factures")
          .select("id")
          .eq("mama_id", mama_id)
          .eq("numero", numero)
          .neq("id", facture?.id || 0)
          .limit(1)
          .maybeSingle();
        setNumeroUsed(!!data);
      } catch (error) {
        console.error(error);
      }
    };
    checkNumero();
  }, [numero, mama_id, facture?.id]);

  useEffect(() => { searchProduits(""); }, [searchProduits]);

  const ecartClass = Math.abs(ecart) > 0.01 ? "text-green-500" : "";

  const parseNum = v => parseFloat(String(v).replace(',', '.')) || 0;

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
        total_ht: parseFloat(String(totalHt).replace(',', '.')) || 0,
        total_tva: autoTva,
        total_ttc: autoTotal,
        bon_livraison: isBonLivraison,
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
        const { produit_nom: _n, total_ht, pu, unite: _u, pmp: _p, ...rest } = ligne;
        const quantite = parseNum(ligne.quantite);
        let prix_unitaire = parseNum(pu);
        if (!prix_unitaire) {
          const ht = parseNum(total_ht);
          prix_unitaire = quantite ? ht / quantite : 0;
        }
        await addLigneFacture(fid, {
          ...rest,
          quantite,
          prix_unitaire: isFinite(prix_unitaire) ? prix_unitaire : 0,
          fournisseur_id,
        });
      }
      onSaved?.();
      toast.success(facture ? "Facture modifiée !" : "Facture ajoutée !");
      if (!facture) {
        const today = new Date().toISOString().slice(0, 10);
        setDate(today);
        setFournisseurId("");
        setFournisseurNom("");
        setNumero("");
        setNumeroUsed(false);
        setStatut("Brouillon");
        setTotalHt("");
        setIsBonLivraison(false);
        setLignes([
          {
            produit_id: "",
            produit_nom: "",
        quantite: 1,
            total_ht: "",
            pu: "",
            tva: 20,
            zone_stock_id: "",
            unite_id: "",
            unite: "",
            pmp: null,
          },
        ]);
        searchFournisseurs("");
        searchProduits("");
      }
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleClose = () => {
    const hasContent =
      statut === "Brouillon" &&
      (fournisseurNom || numero || totalHt || isBonLivraison ||
        lignes.some(l =>
          l.produit_id ||
          l.produit_nom ||
          parseNum(l.quantite) !== 1 ||
          l.total_ht !== "" ||
          l.tva !== 20 ||
          l.zone_stock_id,
        ));
    if (hasContent && !window.confirm("Fermer sans enregistrer ?")) return;
    onClose?.();
  };

  return (
    <GlassCard width="w-full" title={facture ? "Modifier la facture" : "Ajouter une facture"}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }}
        className="space-y-6"
      >
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col lg:col-span-2">
            <div className="flex items-center gap-2 text-sm mb-1">
              <Checkbox
                checked={isBonLivraison}
                onChange={e => {
                  const val = e.target.checked;
                  setIsBonLivraison(val);
                  if (val && !numero?.startsWith("BL")) setNumero("BL");
                  if (!val && numero?.startsWith("BL")) setNumero("");
                }}
              />
              <span>Bon de livraison</span>
            </div>
            <label className="text-sm mb-1">Numéro</label>
            <Input
              type="text"
              value={numero}
              onChange={e => setNumero(e.target.value)}
              placeholder={isBonLivraison ? "BL..." : "Numéro de facture"}
              className={numeroUsed ? "border-red-500" : ""}
              required
            />
            {numeroUsed && <p className="text-xs text-red-500">Numéro déjà existant</p>}
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Date *</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">État</label>
            <Select value={statut} onChange={e => setStatut(e.target.value)}>
              {FACTURE_STATUTS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Total HT</label>
            <Input
              type="number"
              value={totalHt}
              onChange={e => setTotalHt(e.target.value)}
              className="font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div className="flex flex-col lg:col-span-2">
            <label className="text-sm mb-1">Fournisseur *</label>
            <AutoCompleteField
              value={fournisseurNom}
              onChange={obj => {
                const val = obj?.nom || "";
                setFournisseurNom(val);
                setFournisseurId(obj?.id || "");
                if (!obj?.id && val.length >= 2) searchFournisseurs(val);
              }}
              options={fournisseurOptions}
              required
            />
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-2">Lignes produits</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Unité</th>
                  <th>Total HT</th>
                  <th>PU</th>
                  <th>Zone</th>
                  <th>TVA</th>
                  <th>Actions</th>
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
            quantite: 1,
                  total_ht: "",
                  pu: "",
                  tva: 20,
                  zone_stock_id: "",
                  unite_id: "",
                  unite: "",
                  pmp: null,
                },
              ])
            }
          >
            Ajouter ligne
          </Button>
        </section>

        <section className="p-3 mt-4 bg-white/10 border border-white/20 rounded">
          <div className="flex flex-wrap gap-4">
            <span className="font-bold">Total HT : {autoHt.toFixed(2)} €</span>
            <span className="font-bold">- TVA : {autoTva.toFixed(2)} €</span>
            <span className="font-bold">- TTC : {autoTotal.toFixed(2)} €</span>
            <span className={`font-bold ${ecartClass}`}>Écart HT : {ecart.toFixed(2)} €</span>
          </div>
        </section>

        <div className="flex gap-2 mt-4">
          <Button type="submit" variant="primary" className="min-w-[120px]" disabled={numeroUsed}>
            {facture ? "Modifier" : "Ajouter"}
          </Button>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Fermer
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
