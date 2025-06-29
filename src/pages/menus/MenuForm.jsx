// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useMenus } from "@/hooks/useMenus";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { uploadFile, deleteFile, pathFromUrl } from "@/hooks/useStorage";

export default function MenuForm({ menu, fiches = [], onClose }) {
  const { createMenu, updateMenu } = useMenus();
  const [nom, setNom] = useState(menu?.nom || "");
  const [date, setDate] = useState(menu?.date || "");
  const [selectedFiches, setSelectedFiches] = useState(
    menu?.fiches?.map(f => f.fiche_id) || []
  );
  const [ficheInput, setFicheInput] = useState("");
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(menu?.document || "");
  const [loading, setLoading] = useState(false);

  const handleSelectFiche = id => {
    setSelectedFiches(selectedFiches.includes(id)
      ? selectedFiches.filter(f => f !== id)
      : [...selectedFiches, id]
    );
  };

  const handleAddFiche = () => {
    const fiche = fiches.find(f => f.nom === ficheInput);
    if (fiche && !selectedFiches.includes(fiche.id)) {
      setSelectedFiches([...selectedFiches, fiche.id]);
    }
    setFicheInput("");
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

  const selectedObjects = fiches.filter(f => selectedFiches.includes(f.id));
  const coutTotal = selectedObjects.reduce(
    (sum, f) => sum + (Number(f.cout_total) || 0),
    0
  );
  const totalPortions = selectedObjects.reduce(
    (sum, f) => sum + (Number(f.portions) || 0),
    0
  );
  const coutPortion = totalPortions > 0 ? coutTotal / totalPortions : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim() || !date) {
      toast.error("Nom et date requis");
      return;
    }
    if (selectedFiches.length === 0) {
      toast.error("Au moins une fiche requise");
      return;
    }
    if (coutTotal === 0) {
      toast.error("Coût total nul");
      return;
    }
    setLoading(true);
    const menuData = {
      nom,
      date,
      fiches: selectedFiches,
      document: fileUrl || menu?.document,
    };
    try {
      if (menu?.id) {
        await updateMenu(menu.id, menuData);
        toast.success("Menu modifié !");
      } else {
        await createMenu(menuData);
        toast.success("Menu ajouté !");
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
        {menu ? "Modifier le menu" : "Ajouter un menu"}
      </h2>
      <input
        className="input mb-2"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom du menu"
        required
      />
      <input
        className="input mb-2"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />
      <div className="mb-4">
        <label className="block font-semibold mb-2">Fiches du menu :</label>
        <div className="flex gap-2 mb-2">
          <input
            list="fiches-list"
            className="input flex-1"
            value={ficheInput}
            onChange={e => setFicheInput(e.target.value)}
            placeholder="Rechercher une fiche"
          />
          <datalist id="fiches-list">
            {fiches.map(f => (
              <option key={f.id} value={f.nom} />
            ))}
          </datalist>
          <Button type="button" variant="outline" onClick={handleAddFiche}>Ajouter</Button>
        </div>
        {selectedObjects.map(f => (
          <div key={f.id} className="flex items-center gap-2 mb-1">
            <span className="flex-1">{f.nom}</span>
            <Button size="sm" variant="outline" onClick={() => handleSelectFiche(f.id)}>Retirer</Button>
          </div>
        ))}
      </div>
      <div className="mb-4 flex gap-4">
        <div><b>Coût total :</b> {coutTotal.toFixed(2)} €</div>
        <div><b>Coût moyen/portion :</b> {coutPortion.toFixed(2)} €</div>
      </div>
      <label>
        Document/PDF menu : <input type="file" onChange={e => setFile(e.target.files[0])} />
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
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{menu ? "Modifier" : "Ajouter"}</Button>
        <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
      </div>
    </form>
  );
}
