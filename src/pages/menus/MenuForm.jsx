// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useMenus } from "@/hooks/useMenus";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui/GlassCard";
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
    <GlassCard title={menu ? "Modifier le menu" : "Ajouter un menu"} className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-2">
      <h2 className="text-lg font-bold mb-4">
        {menu ? "Modifier le menu" : "Ajouter un menu"}
      </h2>
      <Input
        className="mb-2"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom du menu"
        required
      />
      <Input
        className="mb-2"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />
      <div className="mb-4">
        <label className="block font-semibold mb-2">Fiches du menu :</label>
        <div className="flex gap-2 mb-2">
          <Input
            list="fiches-list"
            className="flex-1"
            value={ficheInput}
            onChange={e => setFicheInput(e.target.value)}
            placeholder="Rechercher une fiche"
          />
          <datalist id="fiches-list">
            {fiches.map(f => (
              <option key={f.id} value={f.nom} />
            ))}
          </datalist>
          <SecondaryButton type="button" onClick={handleAddFiche}>
            Ajouter
          </SecondaryButton>
        </div>
        {selectedObjects.map(f => (
          <div key={f.id} className="flex items-center gap-2 mb-1">
            <span className="flex-1">{f.nom}</span>
            <SecondaryButton
              size="sm"
              onClick={() => handleSelectFiche(f.id)}
            >
              Retirer
            </SecondaryButton>
          </div>
        ))}
      </div>
      <div className="mb-4 flex gap-4">
        <div><b>Coût total :</b> {coutTotal.toFixed(2)} €</div>
        <div><b>Coût moyen/portion :</b> {coutPortion.toFixed(2)} €</div>
      </div>
      <label>
        Document/PDF menu : <input type="file" onChange={e => setFile(e.target.files[0])} />
        <SecondaryButton type="button" className="ml-2" onClick={handleUpload}>
          Upload
        </SecondaryButton>
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
        <PrimaryButton type="submit" disabled={loading}>
          {menu ? "Modifier" : "Ajouter"}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onClose}>
          Annuler
        </SecondaryButton>
      </div>
      </form>
    </GlassCard>
  );
}
