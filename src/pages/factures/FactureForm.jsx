// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect, useMemo } from "react";
import { useFactures } from "@/hooks/useFactures";
import { useProduitsAutocomplete } from "@/hooks/useProduitsAutocomplete";
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import AutoCompleteZoneField from "@/components/ui/AutoCompleteZoneField";
import { useFournisseursAutocomplete } from "@/hooks/useFournisseursAutocomplete";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import GlassCard from "@/components/ui/GlassCard";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import { uploadFile, deleteFile, pathFromUrl } from "@/hooks/useStorage";
import { useProducts } from "@/hooks/useProducts";

export default function FactureForm({ facture, fournisseurs = [], onClose }) {
  const { createFacture, updateFacture, addLigneFacture, calculateTotals } = useFactures();
  const { updateProduct, getProduct } = useProducts();
  const { results: produitOptions, searchProduits } = useProduitsAutocomplete();
  const {
    results: fournisseurOptions,
    searchFournisseurs,
  } = useFournisseursAutocomplete();
  // Utilise la date de facture existante si présente
  const [date, setDate] = useState(
    facture?.date_facture || new Date().toISOString().slice(0, 10)
  );
  const [fournisseur_id, setFournisseurId] = useState(facture?.fournisseur_id || "");
  const [fournisseurName, setFournisseurName] = useState("");
  const [numero, setNumero] = useState(facture?.numero || "");
  const [statut, setStatut] = useState(facture?.statut || "brouillon");
  const [lignes, setLignes] = useState(
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
    ]
  );
  const [totalHtInput, setTotalHtInput] = useState(
    facture?.total_ht ? String(facture.total_ht) : ""
  );
  const [commentaire, setCommentaire] = useState(facture?.commentaire || "");
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(facture?.justificatif || "");
  const [loading, setLoading] = useState(false);
  const autoHt = lignes.reduce(
    (s, l) => s + l.quantite * l.prix_unitaire,
    0
  );
  const autoTva = lignes.reduce(
    (s, l) =>
      s + l.quantite * l.prix_unitaire * (l.tva || 0) / 100,
    0
  );
  const autoTotal = autoHt + autoTva;
  const ecart = useMemo(
    () => autoHt - Number(totalHtInput || 0),
    [autoHt, totalHtInput]
  );
  useEffect(() => {
    if (facture?.fournisseur_id && fournisseurs.length) {
      const found = fournisseurs.find(s => s.id === facture.fournisseur_id);
      setFournisseurName(found?.nom || "");
    }
  }, [facture?.fournisseur_id, fournisseurs]);

  useEffect(() => { searchFournisseurs(fournisseurName); }, [fournisseurName, searchFournisseurs]);

  // Upload PDF réel : à brancher à ton backend ou Supabase Storage
  const handleUpload = async () => {
    if (!file) return toast.error("Sélectionnez un fichier PDF !");
    try {
      if (fileUrl) {
        await deleteFile("factures", pathFromUrl(fileUrl));
      }
      const url = await uploadFile("factures", file);
      setFileUrl(url);
      toast.success("Fichier uploadé !");
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'upload");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !fournisseur_id) {
      toast.error("Date et fournisseur requis !");
      return;
    }
    if (!totalHtInput) {
      toast.error("Total HT requis !");
      return;
    }
    if (loading) return;
    setLoading(true);
    const totalManuel = Number(totalHtInput);
    const diff = autoHt - totalManuel;
    let finalStatut = statut;
    if (Math.abs(diff) > 1) {
      finalStatut = "brouillon";
      toast.error(
        "Total HT différent du calcul automatique. Facture enregistrée en brouillon."
      );
    }
    const invoice = {
      date_facture: date,
      fournisseur_id,
      numero,
      statut: finalStatut,
      total_ht: autoHt,
      total_tva: autoTva,
      total_ttc: autoTotal,
      justificatif: fileUrl || facture?.justificatif,
      commentaire,
    };
    try {
      let fid = facture?.id;
      if (fid) {
        await updateFacture(fid, invoice);
      } else {
        const { data, error } = await createFacture(invoice);
        if (error) throw error;
        fid = data.id;
      }

      for (const ligne of lignes) {
        if (!ligne.produit_id) {
          toast.error("Produit requis pour chaque ligne");
          setLoading(false);
          return;
        }
        const { produit_nom: _unused, majProduit, unite: _u, ...rest } = ligne;
        await addLigneFacture(fid, { ...rest, fournisseur_id });
        if (majProduit) {
          await updateProduct(
            ligne.produit_id,
            {
              tva: ligne.tva,
              zone_stock_id: ligne.zone_stock_id,
              dernier_prix: ligne.prix_unitaire,
            },
            { refresh: false }
          );
        }
      }
      await calculateTotals(fid);
      toast.success(facture ? "Facture modifiée !" : "Facture ajoutée !");
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-6 w-full" title={facture ? "Modifier la facture" : "Ajouter une facture"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm mb-1">Date *</label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
            <label className="block text-sm mb-1">Numéro</label>
            <Input
              type="text"
              placeholder="Numéro"
              value={numero}
              onChange={e => setNumero(e.target.value)}
            />
            <label className="block text-sm mb-1">Fournisseur *</label>
            <Input
              list="fournisseurs-list"
              value={fournisseurName}
              onChange={e => {
                const val = e.target.value;
                setFournisseurName(val);
                const found = fournisseurOptions.find(
                  f => f.nom.toLowerCase() === val.toLowerCase()
                );
                setFournisseurId(found ? found.id : "");
              }}
              placeholder="Fournisseur"
              required
            />
            <datalist id="fournisseurs-list">
              {fournisseurOptions.map(f => (
                <option key={f.id} value={f.nom}>{f.nom}</option>
              ))}
            </datalist>
            <label className="block text-sm mb-1">Commentaire</label>
            <Input
              type="text"
              placeholder="Commentaire"
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-sm mb-1">État</label>
              <Select value={statut} onChange={e => setStatut(e.target.value)}>
                <option value="brouillon">Brouillon</option>
                <option value="en attente">En attente</option>
                <option value="validée">Validée</option>
                <option value="archivée">Archivée</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Total HT *</label>
              <Input
                type="number"
                required
                value={totalHtInput}
                onChange={e => setTotalHtInput(e.target.value)}
              />
              <p className="text-xs mt-1">
                Total calculé : {autoHt.toFixed(2)} € | Écart : {ecart.toFixed(2)} €
              </p>
            </div>
            <div>
              <label className="block text-sm mb-1">Justificatif PDF</label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={e => setFile(e.target.files[0])}
                  className="flex-1"
                />
                <Button type="button" size="sm" onClick={handleUpload}>Upload</Button>
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                  >
                    Voir
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
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
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, idx) => (
                <tr key={idx}>
                  <td className="min-w-[200px]">
                    <AutoCompleteField
                      label=""
                      value={l.produit_id}
                      onChange={async obj => {
                        setLignes(ls => {
                          if (obj?.id && ls.some((ln, j) => j !== idx && ln.produit_id === obj.id)) {
                            toast.error("Produit déjà sélectionné dans une autre ligne");
                          }
                          return ls.map((it, i) =>
                            i === idx
                              ? {
                                  ...it,
                                  produit_nom: obj?.nom || "",
                                  produit_id: obj?.id || "",
                                  unite: obj?.unite || "",
                                  prix_unitaire: obj?.pmp ?? it.prix_unitaire,
                                  tva: obj?.tva ?? it.tva,
                                }
                              : it,
                          );
                        });
                        if (obj?.id) {
                          const prod = await getProduct(obj.id);
                          setLignes(ls =>
                            ls.map((it, i) =>
                              i === idx ? { ...it, zone_stock_id: prod?.zone_stock_id || "" } : it
                            )
                          );
                        }
                        if ((obj?.nom || "").length >= 2) searchProduits(obj.nom);
                      }}
                      options={produitOptions}
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      className="w-full"
                      value={l.quantite}
                      onChange={e =>
                        setLignes(ls =>
                          ls.map((it, i) =>
                            i === idx ? { ...it, quantite: Number(e.target.value) } : it,
                          )
                        )
                      }
                    />
                  </td>
                  <td className="text-center">{l.unite}</td>
                  <td>
                    <Input
                      type="number"
                      className="w-full"
                      value={l.prix_unitaire}
                      onChange={e =>
                        setLignes(ls =>
                          ls.map((it, i) =>
                            i === idx ? { ...it, prix_unitaire: Number(e.target.value) } : it,
                          )
                        )
                      }
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      className="w-full"
                      value={l.tva}
                      onChange={e =>
                        setLignes(ls =>
                          ls.map((it, i) =>
                            i === idx ? { ...it, tva: Number(e.target.value) } : it,
                          )
                        )
                      }
                    />
                  </td>
                  <td className="min-w-[120px]">
                    <AutoCompleteZoneField
                      label=""
                      value={l.zone_stock_id}
                      onChange={obj =>
                        setLignes(ls =>
                          ls.map((it, i) =>
                            i === idx ? { ...it, zone_stock_id: obj?.id || "" } : it,
                          )
                        )
                      }
                    />
                  </td>
                  <td className="text-center">
                    <Checkbox
                      checked={l.majProduit}
                      onChange={e =>
                        setLignes(ls =>
                          ls.map((it, i) =>
                            i === idx ? { ...it, majProduit: e.target.checked } : it,
                          )
                        )
                      }
                    />
                  </td>
                  <td className="text-right">
                    {(l.quantite * l.prix_unitaire * (1 + (l.tva || 0) / 100)).toFixed(2)}
                  </td>
                  <td>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setLignes(ls => ls.filter((_, i) => i !== idx))}
                    >
                      X
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
            <Button
          type="button"
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
        <div className="mt-4 p-2 bg-white/10 backdrop-blur-xl rounded border border-white/20">
          Total HT: {autoHt.toFixed(2)} € - TVA: {autoTva.toFixed(2)} € - TTC: {autoTotal.toFixed(2)} €
        </div>
        <div className="flex gap-2 mt-4">
          <PrimaryButton type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? "Enregistrement..." : facture ? "Modifier" : "Ajouter"}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onClose}>Annuler</SecondaryButton>
        </div>
      </form>
    </GlassCard>
  );
}
