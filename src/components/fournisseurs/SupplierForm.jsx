import { useState } from "react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function SupplierForm({ supplier, onClose }) {
  const { addSupplier, editSupplier } = useSuppliers();
  const [nom, setNom] = useState(supplier?.nom || "");
  const [ville, setVille] = useState(supplier?.ville || "");
  const [telephone, setTelephone] = useState(supplier?.telephone || "");
  const [actif, setActif] = useState(supplier?.actif ?? true);
  const [file, setFile] = useState(null); // Upload document/logo
  const [loading, setLoading] = useState(false);

  const handleUpload = () => {
    if (file) toast.success("Upload document (mock)");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = {
      nom,
      ville,
      telephone,
      actif,
      document: file ? "TODO-upload" : supplier?.document
    };
    try {
      if (supplier?.id) {
        await editSupplier(supplier.id, data);
        toast.success("Fournisseur modifié !");
      } else {
        await addSupplier(data);
        toast.success("Fournisseur ajouté !");
      }
      onClose?.();
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-4">
        {supplier ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
      </h2>
      <input
        className="input mb-2"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom du fournisseur"
        required
      />
      <input
        className="input mb-2"
        value={ville}
        onChange={e => setVille(e.target.value)}
        placeholder="Ville"
      />
      <input
        className="input mb-2"
        value={telephone}
        onChange={e => setTelephone(e.target.value)}
        placeholder="Téléphone"
      />
      <label className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} />
        Actif
      </label>
      <label>
        Document/Logo : <input type="file" onChange={e => setFile(e.target.files[0])} />
        <Button type="button" variant="outline" size="sm" className="ml-2" onClick={handleUpload}>Upload</Button>
      </label>
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{supplier ? "Modifier" : "Ajouter"}</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
