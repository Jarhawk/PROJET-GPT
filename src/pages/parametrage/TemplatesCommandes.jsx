// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React, { useState } from "react";
import useTemplatesCommandes from "@/hooks/useTemplatesCommandes";
import TemplateCommandeForm from "./TemplateCommandeForm";
import { Button } from "@/components/ui/button";

export default function TemplatesCommandes() {
  const { templates, loading, toggleActif } = useTemplatesCommandes();
  const [selected, setSelected] = useState(null);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Templates de commandes</h1>

      <Button onClick={() => setSelected({})}>➕ Nouveau modèle</Button>

      {loading && <p>Chargement...</p>}

      <div className="space-y-2 mt-4">
        {templates.map(tpl => (
          <div
            key={tpl.id}
            className="border p-2 rounded flex flex-col sm:flex-row justify-between"
          >
            <div>
              <strong>{tpl.nom}</strong>
              {!tpl.actif && (
                <span className="ml-2 text-red-500">[Inactif]</span>
              )}
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button onClick={() => setSelected(tpl)}>✏️ Modifier</Button>
              <Button
                variant="destructive"
                onClick={() => toggleActif(tpl.id, !tpl.actif)}
              >
                {tpl.actif ? "Désactiver" : "Réactiver"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <TemplateCommandeForm
          template={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
