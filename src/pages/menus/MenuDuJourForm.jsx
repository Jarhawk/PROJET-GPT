// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useMenuDuJour } from "@/hooks/useMenuDuJour";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { uploadFile, deleteFile, pathFromUrl } from "@/hooks/useStorage";

export default function MenuDuJourForm({ menu, fiches = [], onClose }) {
  const { addMenuDuJour, editMenuDuJour } = useMenuDuJour();
  const [nom, setNom] = useState(menu?.nom || "");
  const [date, setDate] = useState(menu?.date || "");
  const [prixVente, setPrixVente] = useState(menu?.prix_vente_ttc || 0);
  const [tva, setTva] = useState(menu?.tva || 5.5);
  const [selectedFiches, setSelectedFiches] = useState(
    menu?.fiches?.map(f => f.fiche_id) || []
  );
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(menu?.document || "");
  const [loading, setLoading] = useState(false);

  const selectedObjects = fiches.filter(f => selectedFiches.includes(f.id));
  const coutTotal = selectedObjects.reduce((sum, f) => sum + (Number(f.cout_total) || 0), 0);
  const marge = prixVente > 0 ? ((prixVente - coutTotal) / prixVente) * 100 : 0;

  const handleSelectFiche = id => {
    setSelectedFiches(selectedFiches.includes(id)
      ? selectedFiches.filter(f => f !== id)
      : [...selectedFiches, id]
    );
  };

  // Upload PDF/image vers Supabase Storage
  const handleUpload = async () => {
    if (!file) return toast.error("Sélectionnez un fichier");
    try {
      if (fileUrl) {
        await deleteFile("menus", pathFromUrl(fileUrl));
      }
      const url = await uploadFile("menus", file);
      setFileUrl(url);
      toast.success("Fichier uploadé !");
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'upload");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim() || !date) {
      toast.error("Nom et date requis");
      return;
    }
    setLoading(true);
    const menuData = {
      nom,
      date,
      fiches: selectedFiches,
      document: fileUrl || menu?.document,
      prix_vente_ttc: prixVente || null,
      tva: tva || null
    };
    try {
      if (menu?.id) {
        await editMenuDuJour(menu.id, menuData);
        toast.success("Menu du jour modifié !");
      } else {
        await addMenuDuJour(menuData);
        toast.success("Menu du jour ajouté !");
      }
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'enregistrement.");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-glass border border-borderGlass backdrop-blur p-6 rounded-2xl shadow-lg max-w-xl mx-auto"
    >
      <h2 className="text-lg font-bold mb-4">
        {menu ? "Modifier le menu du jour" : "Ajouter un menu du jour"}
      </h2>
      <input
        className="input mb-2"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom du menu du jour"
        required
      />
      <input
        className="input mb-2"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />
      <div className="flex gap-2 mb-2">
        <input
          type="number"
          className="input"
          placeholder="Prix vente TTC"
          min={0}
          step="0.01"
          value={prixVente}
          onChange={e => setPrixVente(Number(e.target.value))}
        />
        <input
          type="number"
          className="input"
          placeholder="TVA %"
          min={0}
          step="0.1"
          value={tva}
          onChange={e => setTva(Number(e.target.value))}
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-2">Fiches du menu :</label>
        <div className="max-h-48 overflow-auto border border-borderGlass rounded p-2 bg-glass backdrop-blur">
          {fiches.map(f => (
            <label key={f.id} className="block">
              <input
                type="checkbox"
                checked={selectedFiches.includes(f.id)}
                onChange={() => handleSelectFiche(f.id)}
                className="mr-2"
              />
              {f.nom}
            </label>
          ))}
        </div>
      </div>
      <label>
        Document/PDF du menu : <input type="file" onChange={e => setFile(e.target.files[0])} />
        <Button type="button" size="sm" variant="outline" className="ml-2" onClick={handleUpload}>Upload</Button>
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
      <div className="my-2 flex gap-4">
        <div><b>Coût total :</b> {coutTotal.toFixed(2)} €</div>
        {prixVente > 0 && (
          <div><b>Marge :</b> {marge.toFixed(1)}%</div>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{menu ? "Modifier" : "Ajouter"}</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
