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
  const { createFacture, updateFacture, addLigneFacture } = useFactures();
  const { updateProduct } = useProducts();
  const { results: fournisseurOptions, searchFournisseurs } = useFournisseursAutocomplete();
  const { results: produitOptions, searchProduits } = useProduitsAutocomplete();
  const { mama_id } = useAuth();
  const formRef = useRef(null);

  const [date, setDate] = useState(
    facture?.date_facture || new Date().toISOString().slice(0, 10),
  );
  const [fournisseur_id, setFournisseurId] = useState(facture?.fournisseur_id || "");
  const [fournisseurNom, setFournisseurNom] = useState(facture?.fournisseur?.nom || "");
  const [numero, setNumero] = useState(facture?.numero || "");
  const [bonLivraison, setBonLivraison] = useState(
    facture?.bon_livraison || "",
  );
  const [numeroUsed, setNumeroUsed] = useState(false);
  const [statut, setStatut] = useState(facture?.statut || "brouillon");
  const [lignes, setLignes] = useState(() =>
    facture?.lignes?.map(l => ({
      ...l,
      produit_nom: l.produit?.nom || "",
      unite: l.produit?.unite || "",
      majProduit: false,
      zone_stock_id: l.zone_stock_id || "",
      prix_unitaire: l.prix_unitaire != null ? String(l.prix_unitaire) : "",
    })) || [
      {
        produit_id: "",
        produit_nom: "",
        unite: "",
        quantite: 1,
        prix_unitaire: "",
        tva: 20,
        majProduit: false,
        zone_stock_id: "",
      },
    ],
  );
  const [commentaire, setCommentaire] = useState(facture?.commentaire || "");
  const [totalHt, setTotalHt] = useState(
    facture?.total_ht !== undefined && facture?.total_ht !== null
      ? String(facture.total_ht)
      : ""
  );
  const { autoHt, autoTva, autoTotal } = useFactureForm(lignes);
  const ecart = (parseFloat(totalHt) || 0) - autoHt;

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

  useEffect(() => { searchProduits(""); }, [searchProduits]);

  const ecartClass = Math.abs(ecart) > 0.01 ? "text-green-500" : "";

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
        total_ht: parseFloat(totalHt) || 0,
        total_tva: autoTva,
        total_ttc: autoTotal,
        commentaire,
        bon_livraison: bonLivraison || null,
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
        const {
          produit_nom: _n,
          majProduit: _m,
          unite: _u,
          prix_unitaire,
          ...rest
        } = ligne;
        await addLigneFacture(fid, {
          ...rest,
          prix_unitaire: Number(prix_unitaire) || 0,
          fournisseur_id,
        });
        if (ligne.majProduit) {
          await updateProduct(
            ligne.produit_id,
            {
              dernier_prix: Number(prix_unitaire) || 0,
              zone_stock_id: ligne.zone_stock_id,
              tva: ligne.tva,
            },
            { refresh: false },
          );
        }
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
        setStatut("brouillon");
        setCommentaire("");
        setTotalHt("");
        setBonLivraison("");
        setLignes([
          {
            produit_id: "",
            produit_nom: "",
            unite: "",
            quantite: 1,
            prix_unitaire: "",
            tva: 20,
            majProduit: false,
            zone_stock_id: "",
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
      statut === "brouillon" &&
      (fournisseurNom || numero || commentaire || totalHt || bonLivraison ||
        lignes.some(l =>
          l.produit_id ||
          l.produit_nom ||
          l.quantite !== 1 ||
          l.prix_unitaire !== "" ||
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
            <label className="text-sm mb-1">Bon de livraison n°</label>
            <Input
              type="text"
              value={bonLivraison}
              placeholder="Saisir ou coller un numéro..."
              onChange={e => setBonLivraison(e.target.value)}
            />
          </div>
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
          <div className="flex flex-col lg:col-span-2">
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
                  prix_unitaire: "",
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

        <section className="p-3 mt-4 bg-white/10 border border-white/20 rounded">
          <div className="flex flex-wrap gap-4">
            <span className="font-bold">Total HT: {autoHt.toFixed(2)} €</span>
            <span className="font-bold">TVA: {autoTva.toFixed(2)} €</span>
            <span className="font-bold">TTC: {autoTotal.toFixed(2)} €</span>
            <span className={`font-bold ${ecartClass}`}>Écart HT: {ecart.toFixed(2)} €</span>
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
