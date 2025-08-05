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
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Loader2 } from "lucide-react";

export default function FactureForm({ facture = null, onClose, onSaved }) {
  const { createFacture, updateFacture } = useFactures();
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
  const defaultLigne = {
    produit_id: "",
    produit_nom: "",
    quantite: "1",
    total_ht: "0",
    pu: "0",
    tva: 20,
    zone_stock_id: "",
    unite_id: "",
    unite: "",
    pmp: 0,
    manuallyEdited: false,
  };
  const [lignes, setLignes] = useState([defaultLigne]);
  const [totalHt, setTotalHt] = useState(
    facture?.total_ht !== undefined && facture?.total_ht !== null
      ? String(facture.total_ht)
      : ""
  );
  const { autoHt, autoTva, autoTotal } = useFactureForm(lignes);
  const ecart = (parseFloat(String(totalHt).replace(',', '.')) || 0) - autoHt;
  const factureId = facture?.id;
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isBonLivraison && !numero.startsWith("BL")) {
      setNumero("BL");
    } else if (!isBonLivraison && numero.startsWith("BL")) {
      setNumero("");
    }
  }, [isBonLivraison]);

  useEffect(() => {
    setIsBonLivraison(numero.startsWith("BL"));
  }, [numero]);

  useEffect(() => {
    if (!factureId) {
      searchFournisseurs("");
    }
  }, [factureId, searchFournisseurs]);

  useEffect(() => {
    const checkNumero = async () => {
      if (!numero) { setNumeroUsed(false); return; }
      try {
        const { data } = await supabase
          .from("factures")
          .select("id")
          .eq("mama_id", mama_id)
          .eq("numero", numero)
          .neq("id", factureId || 0)
          .limit(1)
          .maybeSingle();
        setNumeroUsed(!!data);
      } catch (error) {
        console.error(error);
      }
    };
    checkNumero();
  }, [numero, mama_id, factureId]);

  useEffect(() => { searchProduits(""); }, [searchProduits]);

  useEffect(() => {
    const loadFacture = async () => {
      if (!factureId) return;
      setLoadingData(true);
      try {
        const { data: f, error } = await supabase
          .from("factures")
          .select(
            `*,
            fournisseur: fournisseurs(id, nom),
            facture_lignes(
              id,
              produit_id,
              quantite,
              prix_unitaire,
              tva,
              zone_stock_id,
              produit: produits(nom, unite_id, pmp, unite:unite_id(nom))
            )`
          )
          .eq("id", factureId)
          .single();
        if (error) throw error;

        setDate(f.date_facture || new Date().toISOString().slice(0, 10));
        setFournisseurId(f.fournisseur_id || "");
        setNumero(f.numero || "");
        setStatut(f.statut || "Brouillon");
        setIsBonLivraison(Boolean(f.bon_livraison) || (f.numero || "").startsWith("BL"));
        setTotalHt(
          f?.total_ht !== undefined && f?.total_ht !== null
            ? String(f.total_ht)
            : "",
        );
        setFournisseurNom(f.fournisseur?.nom || "");
        if (f.fournisseur?.nom) searchFournisseurs(f.fournisseur.nom);

        const lignesData = f.facture_lignes || [];
        const mapped = lignesData.map(l => {
          const q = parseFloat(l.quantite) || 0;
          const pu = parseFloat(l.prix_unitaire) || 0;
          const total = q * pu;
          return {
            produit_id: l.produit_id || "",
            produit_nom: l.produit?.nom || "",
            quantite: String(q),
            total_ht: total.toFixed(2),
            pu: pu.toFixed(2),
            tva: l.tva ?? 20,
            zone_stock_id: l.zone_stock_id || "",
            unite_id: l.produit?.unite_id || "",
            unite: l.produit?.unite?.nom || "",
            pmp: l.produit?.pmp ?? 0,
            manuallyEdited: false,
          };
        });

        setLignes(mapped.length ? mapped : [defaultLigne]);
      } catch (err) {
        console.error(err);
        toast.error("Erreur de chargement de la facture");
      } finally {
        setLoadingData(false);
      }
    };
    loadFacture();
  }, [factureId, searchFournisseurs]);

  const ecartClass = Math.abs(ecart) > 0.01 ? "text-green-500" : "";

  const parseNum = v => parseFloat(String(v).replace(',', '.')) || 0;

  const handleSubmit = async e => {
    e.preventDefault();
    if (numeroUsed) return toast.error("Référence déjà utilisée");
    if (!date || !fournisseur_id) {
      toast.error("Champs requis manquants !");
      formRef.current?.querySelector(":invalid")?.focus();
      return;
    }
    setSaving(true);
    try {
      let fid = factureId;
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

      const lignesRows = [];
      const fournisseurRows = [];
      const achatsRows = [];
      for (let i = 0; i < lignes.length; i++) {
        const ligne = lignes[i];
        const { produit_nom: _n, total_ht, pu, unite: _u, pmp: _p, manuallyEdited: _m, ...rest } = ligne;
        const quantite = parseNum(ligne.quantite);
        const prixSaisi = parseNum(pu);
        const totalSaisi = parseNum(total_ht);
        if (
          !ligne.produit_id ||
          !ligne.zone_stock_id ||
          quantite <= 0 ||
          (!prixSaisi && !totalSaisi)
        ) {
          toast.error("Ligne de produit invalide");
          setSaving(false);
          return;
        }
        let prix_unitaire = prixSaisi;
        if (!prix_unitaire) {
          prix_unitaire = quantite ? totalSaisi / quantite : 0;
        }
        const prixFinal = isFinite(prix_unitaire) ? prix_unitaire : 0;
        lignesRows.push({
          ...rest,
          quantite,
          prix_unitaire: prixFinal,
          tva: ligne.tva,
          zone_stock_id: ligne.zone_stock_id,
          total: quantite * prixFinal,
          facture_id: fid,
          mama_id,
        });
        fournisseurRows.push({
          produit_id: ligne.produit_id,
          fournisseur_id,
          prix_achat: prixFinal,
          date_livraison: date,
          mama_id,
        });
        achatsRows.push({
          produit_id: ligne.produit_id,
          fournisseur_id,
          prix: prixFinal,
          quantite,
          date_achat: date,
          mama_id,
        });
      }

      await Promise.all([
        supabase
          .from("facture_lignes")
          .upsert(lignesRows, { returning: "minimal" }),
        supabase
          .from("fournisseur_produits")
          .upsert(fournisseurRows, {
            onConflict: ["produit_id", "fournisseur_id", "date_livraison"],
            returning: "minimal",
          }),
        supabase.from("achats").insert(achatsRows, { returning: "minimal" }),
      ]);

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
        setLignes([{ ...defaultLigne }]);
        searchFournisseurs("");
        searchProduits("");
      }
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
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
          parseNum(l.total_ht) !== 0 ||
          l.tva !== 20 ||
          l.zone_stock_id,
        ));
    if (hasContent && !window.confirm("Fermer sans enregistrer ?")) return;
    onClose?.();
  };

  if (loadingData) return <LoadingSpinner message="Chargement..." />;

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
                onChange={e => setIsBonLivraison(e.target.checked)}
              />
              <span>Bon de livraison</span>
            </div>
            <label className="text-sm mb-1">Référence</label>
            <Input
              type="text"
              value={numero}
              onChange={e => setNumero(e.target.value)}
              placeholder="Référence facture ou bon de livraison"
              className={numeroUsed ? "border-red-500" : ""}
              required
            />
            {numeroUsed && <p className="text-xs text-red-500">Référence déjà existante</p>}
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
            <div className="relative">
              <Input
                type="text"
                value={totalHt}
                onChange={e => setTotalHt(e.target.value.replace(',', '.'))}
                onBlur={() =>
                  setTotalHt(
                    (parseFloat(String(totalHt).replace(',', '.')) || 0).toFixed(2),
                  )
                }
                className="font-bold pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">€</span>
            </div>
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
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col style={{ width: "25%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "5%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="text-left">Produit</th>
                  <th className="text-left">Quantité</th>
                  <th className="text-left">Unité</th>
                  <th className="text-left">Total HT</th>
                  <th className="text-left">PU</th>
                  <th className="text-left">PMP</th>
                  <th className="text-left">TVA</th>
                  <th className="text-left">Zone</th>
                  <th className="text-right">Actions</th>
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
              setLignes(ls => [...ls, { ...defaultLigne }])
            }
          >
            Ajouter ligne
          </Button>
        </section>

        <section className="p-3 mt-4 bg-white/10 border border-white/20 rounded">
          <div className="flex flex-wrap gap-4">
            <span>
              Total HT : {autoHt.toFixed(2)} € – TVA : {autoTva.toFixed(2)} € – TTC : {autoTotal.toFixed(2)} €
            </span>
            <span className={`font-bold ${ecartClass}`}>Écart HT : {ecart.toFixed(2)} €</span>
          </div>
        </section>

        <div className="flex gap-2 mt-4">
          <Button
            type="submit"
            variant="primary"
            className="min-w-[120px]"
            disabled={numeroUsed || saving}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </span>
            ) : facture ? (
              "Modifier"
            ) : (
              "Ajouter"
            )}
          </Button>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Fermer
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
