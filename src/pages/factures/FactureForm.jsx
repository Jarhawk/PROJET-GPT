import { useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { uploadFile, deleteFile, pathFromUrl } from "@/hooks/useStorage";
import { useInvoiceOcr } from "@/hooks/useInvoiceOcr";

export default function FactureForm({ facture, suppliers = [], onClose }) {
  const { addInvoice, editInvoice } = useInvoices();
  const [date, setDate] = useState(facture?.date || "");
  const [fournisseur_id, setFournisseurId] = useState(facture?.fournisseur_id || "");
  const [montant, setMontant] = useState(facture?.montant || 0);
  const [statut, setStatut] = useState(facture?.statut || "en attente");
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(facture?.justificatif || "");
  const [loading, setLoading] = useState(false);
  const { scan, text: ocrText } = useInvoiceOcr();

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
    setLoading(true);
    const invoice = {
      date,
      fournisseur_id,
      montant,
      statut,
      justificatif: fileUrl || facture?.justificatif
    };
    try {
      if (facture?.id) {
        await editInvoice(facture.id, invoice);
        toast.success("Facture modifiée !");
      } else {
        await addInvoice(invoice);
        toast.success("Facture ajoutée !");
      }
      onClose?.();
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
    setLoading(false);
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
      <input
        className="input mb-2"
        type="number"
        value={montant}
        onChange={e => setMontant(Number(e.target.value))}
        placeholder="Montant"
        required
      />
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
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{facture ? "Modifier" : "Ajouter"}</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
