// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React, { useState } from "react";
import useTemplatesCommandes from "@/hooks/useTemplatesCommandes";
import { Button } from "@/components/ui/button";

export default function TemplateCommandeForm({ template, onClose }) {
  const { saveTemplate } = useTemplatesCommandes();
  const [nom, setNom] = useState(template.nom || "");
  const [adresse, setAdresse] = useState(template.adresse_livraison || "");
  const [pied, setPied] = useState(template.pied_de_page || "");
  const [champs, setChamps] = useState(
    template.champs_visibles || {
      reference: true,
      date: true,
      zone: true,
      fournisseur: true,
      quantite: true,
      prix: true,
      commentaire: true,
    }
  );

  const toggleChamp = champ => {
    setChamps(prev => ({ ...prev, [champ]: !prev[champ] }));
  };

  const save = async () => {
    const payload = {
      ...template,
      nom,
      adresse_livraison: adresse,
      pied_de_page: pied,
      champs_visibles: champs,
    };
    await saveTemplate(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto">
        <h2 className="text-lg font-bold mb-4">
          {template.id ? "Modifier" : "Créer"} un template
        </h2>

        <label className="block text-sm font-medium">Nom</label>
        <input
          className="w-full border p-1 mb-3"
          value={nom}
          onChange={e => setNom(e.target.value)}
        />

        <label className="block text-sm font-medium">Adresse de livraison</label>
        <textarea
          className="w-full border p-1 mb-3"
          value={adresse}
          onChange={e => setAdresse(e.target.value)}
        />

        <label className="block text-sm font-medium">Pied de page</label>
        <textarea
          className="w-full border p-1 mb-3"
          value={pied}
          onChange={e => setPied(e.target.value)}
        />

        <label className="block text-sm font-medium">Champs à afficher</label>
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          {Object.keys(champs).map(champ => (
            <label key={champ}>
              <input
                type="checkbox"
                checked={champs[champ]}
                onChange={() => toggleChamp(champ)}
                className="mr-1"
              />
              {champ}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={save}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}
