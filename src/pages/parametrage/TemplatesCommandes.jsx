// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { useTemplatesCommandes } from "@/hooks/useTemplatesCommandes";
import useFournisseurs from "@/hooks/data/useFournisseurs";
import TemplateCommandeForm from "./TemplateCommandeForm";
import { Button } from "@/components/ui/button";

export default function TemplatesCommandes() {
  const { fetchTemplates, deleteTemplate } = useTemplatesCommandes();
  const { data: fournisseurs = [] } = useFournisseurs({ actif: true });
  const fournisseursList = Array.isArray(fournisseurs) ? fournisseurs : [];
  const [templates, setTemplates] = useState([]);
  const templatesList = Array.isArray(templates) ? templates : [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [fournisseurId, setFournisseurId] = useState("");


  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchTemplates({ fournisseur_id: fournisseurId || undefined });
    if (error) setError(error);
    setTemplates(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [fetchTemplates, fournisseurId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce modèle ?")) return;
    await deleteTemplate(id);
    load();
  };

  const templateRows = [];
  for (const tpl of templatesList) {
    templateRows.push(
      <tr key={tpl.id} className="border-b">
        <td className="p-2">{tpl.nom}</td>
        <td className="p-2">{tpl.fournisseur ? tpl.fournisseur.nom : "Générique"}</td>
        <td className="p-2">{tpl.actif ? "Oui" : "Non"}</td>
        <td className="p-2">{tpl.updated_at ? new Date(tpl.updated_at).toLocaleDateString() : ""}</td>
        <td className="p-2 flex gap-2">
          <Button size="sm" onClick={() => setSelected(tpl)}>
            Modifier
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(tpl.id)}>
            Supprimer
          </Button>
        </td>
      </tr>,
    );
  }

  const fournisseurOptions = [];
  for (const f of fournisseursList) {
    fournisseurOptions.push(
      <option key={f.id} value={f.id}>
        {f.nom}
      </option>,
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Templates de commandes</h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button onClick={() => setSelected({})}>➕ Nouveau modèle</Button>
        <select
          className="border px-2 py-1 rounded text-black"
          value={fournisseurId}
          onChange={(e) => setFournisseurId(e.target.value)}
        >
          <option value="">Tous les fournisseurs</option>
          {fournisseurOptions}
        </select>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p className="text-red-500">{error.message}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Nom</th>
            <th className="p-2">Fournisseur</th>
            <th className="p-2">Actif</th>
            <th className="p-2">Date MAJ</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {templateRows}
        </tbody>
      </table>

      {selected && (
        <TemplateCommandeForm
          template={selected}
          fournisseurs={fournisseursList}
          onClose={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}

