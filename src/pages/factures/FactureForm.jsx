// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useFactures } from "@/hooks/useFactures";
import { useProduitsAutocomplete } from "@/hooks/useProduitsAutocomplete";
import AutoCompleteField from "@/components/ui/AutoCompleteField";
import { useFournisseursAutocomplete } from "@/hooks/useFournisseursAutocomplete";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui/GlassCard";
import toast from "react-hot-toast";
import { uploadFile, deleteFile, pathFromUrl } from "@/hooks/useStorage";
import { useInvoiceOcr } from "@/hooks/useInvoiceOcr";

export default function FactureForm({ facture, suppliers = [], onClose }) {
  const { createFacture, updateFacture, addLigneFacture, calculateTotals } = useFactures();
  const { results: produitOptions, searchProduits } = useProduitsAutocomplete();
  const {
    results: fournisseurOptions,
    searchFournisseurs,
  } = useFournisseursAutocomplete();
  // Utilise la date de facture existante si présente
  const [date, setDate] = useState(facture?.date_facture || "");
  const [fournisseur_id, setFournisseurId] = useState(facture?.fournisseur_id || "");
  const [fournisseurName, setFournisseurName] = useState("");
  const [numero, setNumero] = useState(facture?.numero || "");
  const [statut, setStatut] = useState(facture?.statut || "brouillon");
  const [lignes, setLignes] = useState(
    facture?.lignes?.map(l => ({
      ...l,
      produit_nom: l.produit?.nom || "",
    })) || [
      { produit_id: "", produit_nom: "", quantite: 1, prix_unitaire: 0, tva: 20 },
    ]
  );
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(facture?.justificatif || "");
  const [loading, setLoading] = useState(false);
  const { scan, text: ocrText } = useInvoiceOcr();

  useEffect(() => {
    if (facture?.fournisseur_id && suppliers.length) {
      const found = suppliers.find(s => s.id === facture.fournisseur_id);
      setFournisseurName(found?.nom || "");
    }
  }, [facture?.fournisseur_id, suppliers]);

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
    if (loading) return;
    setLoading(true);
    const total_ht = lignes.reduce((s,l) => s + l.quantite * l.prix_unitaire, 0);
    const total_tva = lignes.reduce((s,l) => s + l.quantite * l.prix_unitaire * (l.tva || 0) / 100, 0);
    const invoice = {
      date_facture: date,
      fournisseur_id,
      numero,
      statut,
      total_ht,
      total_tva,
      total_ttc: total_ht + total_tva,
      justificatif: fileUrl || facture?.justificatif,
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
        if (ligne.produit_id) {
          const { produit_nom: _unused, ...rest } = ligne;
          await addLigneFacture(fid, { ...rest, fournisseur_id });
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
    <GlassCard className="p-6">
      <form onSubmit={handleSubmit} className="space-y-2">
        <h2 className="text-lg font-bold mb-4">
          {facture ? "Modifier la facture" : "Ajouter une facture"}
        </h2>
      <label className="block text-sm mb-1">Date *</label>
      <Input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
        className="mb-2"
      />
      <label className="block text-sm mb-1">Numéro</label>
      <Input
        type="text"
        placeholder="Numéro"
        value={numero}
        onChange={e => setNumero(e.target.value)}
        className="mb-2"
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
        className="mb-2"
      />
      <datalist id="fournisseurs-list">
        {fournisseurOptions.map(f => (
          <option key={f.id} value={f.nom}>{f.nom}</option>
        ))}
      </datalist>
      <table className="w-full text-sm mb-2">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Qté</th>
            <th>PU</th>
            <th>TVA %</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, idx) => (
            <tr key={idx}>
              <td className="min-w-[150px]">
                <AutoCompleteField
                  label=""
                  value={l.produit_nom}
                  onChange={val => {
                    setLignes(ls => ls.map((it,i) =>
                      i===idx ? {
                        ...it,
                        produit_nom: val,
                        produit_id: produitOptions.find(p => p.nom === val)?.id || ""
                      } : it
                    ));
                    if (val.length >= 2) searchProduits(val);
                  }}
                  options={produitOptions.map(p => p.nom)}
                />
              </td>
              <td>
                <input type="number" className="input" value={l.quantite} onChange={e => setLignes(ls => ls.map((it,i)=> i===idx ? { ...it, quantite: Number(e.target.value) } : it))} />
              </td>
              <td>
                <input type="number" className="input" value={l.prix_unitaire} onChange={e => setLignes(ls => ls.map((it,i)=> i===idx ? { ...it, prix_unitaire: Number(e.target.value) } : it))} />
              </td>
              <td>
                <input type="number" className="input" value={l.tva} onChange={e => setLignes(ls => ls.map((it,i)=> i===idx ? { ...it, tva: Number(e.target.value) } : it))} />
              </td>
              <td>
                <Button type="button" size="sm" variant="outline" onClick={() => setLignes(ls => ls.filter((_,i)=>i!==idx))}>X</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        type="button"
        onClick={() =>
          setLignes(ls => [
            ...ls,
            { produit_id: "", produit_nom: "", quantite: 1, prix_unitaire: 0, tva: 20 },
          ])
        }
      >
        Ajouter ligne
      </Button>
      <select
        className="input mb-2"
        value={statut}
        onChange={e => setStatut(e.target.value)}
      >
        <option value="brouillon">Brouillon</option>
        <option value="en attente">En attente</option>
        <option value="validée">Validée</option>
        <option value="payée">Payée</option>
        <option value="refusée">Refusée</option>
        <option value="annulée">Annulée</option>
        <option value="archivée">Archivée</option>
      </select>
      <label className="block text-sm mb-1">Justificatif PDF</label>
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="application/pdf,image/*"
          onChange={e => setFile(e.target.files[0])}
          className="flex-1"
        />
        <Button type="button" size="sm" onClick={handleUpload}>Upload</Button>
        <Button type="button" size="sm" onClick={() => scan(file)} className="bg-white/20">OCR</Button>
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
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-600 underline"
          >
            Voir
          </a>
        )}
      {ocrText && (
        <div className="text-xs text-gray-600 whitespace-pre-wrap mt-2 border rounded p-2 max-h-32 overflow-auto">
          {ocrText}
        </div>
      )}
      <div className="mt-4 p-2 bg-glass backdrop-blur rounded border border-borderGlass">
        Total HT: {lignes.reduce((s,l)=>s+l.quantite*l.prix_unitaire,0).toFixed(2)} € - TVA: {lignes.reduce((s,l)=>s+l.quantite*l.prix_unitaire*(l.tva||0)/100,0).toFixed(2)} € - TTC: {(lignes.reduce((s,l)=>s+l.quantite*l.prix_unitaire,0)+lignes.reduce((s,l)=>s+l.quantite*l.prix_unitaire*(l.tva||0)/100,0)).toFixed(2)} €
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
