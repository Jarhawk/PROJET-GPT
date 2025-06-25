import { useState, useEffect } from "react";
// ✅ Vérifié
import { useFactures } from "@/hooks/useFactures";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { uploadFile, deleteFile, pathFromUrl } from "@/hooks/useStorage";
import { useInvoiceOcr } from "@/hooks/useInvoiceOcr";

export default function FactureForm({ facture, suppliers = [], onClose }) {
  const { createFacture, updateFacture, addLigneFacture, calculateTotals } = useFactures();
  const { products, fetchProducts } = useProducts();
  const [date, setDate] = useState(facture?.date || "");
  const [fournisseur_id, setFournisseurId] = useState(facture?.fournisseur_id || "");
  const [reference, setReference] = useState(facture?.reference || "");
  const [commentaire, setCommentaire] = useState(facture?.commentaire || "");
  const [statut, setStatut] = useState(facture?.statut || "en attente");
  const [lignes, setLignes] = useState(facture?.lignes || [
    { product_id: "", quantite: 1, prix_unitaire: 0, tva: 20 }
  ]);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(facture?.justificatif || "");
  const [loading, setLoading] = useState(false);
  const { scan, text: ocrText } = useInvoiceOcr();

  useEffect(() => { fetchProducts({ limit: 1000 }); }, [fetchProducts]);

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
      date,
      fournisseur_id,
      reference,
      commentaire,
      statut,
      total_ht,
      total_tva,
      total_ttc: total_ht + total_tva,
      justificatif: fileUrl || facture?.justificatif,
    };
    console.log("DEBUG form", invoice, lignes);
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
        if (ligne.product_id) {
          await addLigneFacture(fid, { ...ligne, fournisseur_id });
        }
      }
      await calculateTotals(fid);
      toast.success(facture ? "Facture modifiée !" : "Facture ajoutée !");
      onClose?.();
    } catch (err) {
      console.log("DEBUG error", err);
      toast.error(err?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">
        {facture ? "Modifier la facture" : "Ajouter une facture"}
      </h2>
      <input
        className="input mb-2"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />
      <input
        className="input mb-2"
        type="text"
        placeholder="Numéro"
        value={reference}
        onChange={e => setReference(e.target.value)}
      />
      <input
        className="input mb-2"
        type="text"
        placeholder="Commentaire"
        value={commentaire}
        onChange={e => setCommentaire(e.target.value)}
      />
      <select
        className="input mb-2"
        value={fournisseur_id}
        onChange={e => setFournisseurId(e.target.value)}
        required
      >
        <option value="">Fournisseur</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>{s.nom}</option>
        ))}
      </select>
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
              <td>
                <input
                  list="products"
                  className="input"
                  value={l.product_id}
                  onChange={e => setLignes(ls => ls.map((it,i) => i===idx ? { ...it, product_id: e.target.value } : it))}
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
      <Button type="button" variant="outline" onClick={() => setLignes(ls => [...ls, { product_id: "", quantite:1, prix_unitaire:0, tva:20 }])}>Ajouter ligne</Button>
      <datalist id="products">
        {products.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
      </datalist>
      <select
        className="input mb-2"
        value={statut}
        onChange={e => setStatut(e.target.value)}
      >
        <option value="en attente">En attente</option>
        <option value="payée">Payée</option>
        <option value="refusée">Refusée</option>
      </select>
      <label>
        Justificatif PDF : <input type="file" accept="application/pdf,image/*" onChange={e => setFile(e.target.files[0])} />
        <Button type="button" size="sm" variant="outline" className="ml-2" onClick={handleUpload}>Upload</Button>
        <Button type="button" size="sm" variant="secondary" className="ml-2" onClick={() => scan(file)}>OCR</Button>
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
      </label>
      {ocrText && (
        <div className="text-xs text-gray-600 whitespace-pre-wrap mt-2 border rounded p-2 max-h-32 overflow-auto">
          {ocrText}
        </div>
      )}
      <div className="mt-4 p-2 bg-gray-100 rounded">
        Total HT: {lignes.reduce((s,l)=>s+l.quantite*l.prix_unitaire,0).toFixed(2)} € - TVA: {lignes.reduce((s,l)=>s+l.quantite*l.prix_unitaire*(l.tva||0)/100,0).toFixed(2)} € - TTC: {(lignes.reduce((s,l)=>s+l.quantite*l.prix_unitaire,0)+lignes.reduce((s,l)=>s+l.quantite*l.prix_unitaire*(l.tva||0)/100,0)).toFixed(2)} €
      </div>
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{facture ? "Modifier" : "Ajouter"}</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
