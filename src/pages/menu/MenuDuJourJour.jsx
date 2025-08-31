// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMenuDuJour } from "@/hooks/useMenuDuJour";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const categories = ["entree", "plat", "dessert", "boisson"];

export default function MenuDuJourJour() {
  const { date } = useParams();
  const { fetchDay, createOrUpdateMenu } = useMenuDuJour();
  const { access_rights } = useAuth();
  const [lignes, setLignes] = useState([]);

  useEffect(() => {
    fetchDay(date).then(({ lignes }) => setLignes(Array.isArray(lignes) ? lignes : []));
  }, [date, fetchDay]);

  const canEdit = access_rights?.menus_jour?.peut_modifier;

    const list = Array.isArray(lignes) ? lignes : [];
    const categoryOptions = [];
    for (const c of categories) {
      categoryOptions.push(<option key={c} value={c}>{c}</option>);
    }

  const addLine = () => {
    setLignes([...list, { categorie: "entree", fiche_id: "", portions: 1 }]);
  };

  const updateLine = (idx, field, value) => {
    const next = [];
    for (let i = 0; i < list.length; i++) {
      const l = list[i];
      next.push(i === idx ? { ...l, [field]: value } : l);
    }
    setLignes(next);
  };

  const removeLine = (idx) => {
    const next = [];
    for (let i = 0; i < list.length; i++) {
      if (i !== idx) next.push(list[i]);
    }
    setLignes(next);
  };

  const save = async () => {
    await createOrUpdateMenu(date, list);
  };

  const total = list.reduce((s, l) => s + Number(l.cout_ligne_total || 0), 0);

  if (!access_rights?.menus_jour?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

    const lineElements = [];
    for (let idx = 0; idx < list.length; idx++) {
      const l = list[idx];
      lineElements.push(
        <div key={idx} className="border p-2 mb-2 rounded">
          <div className="flex gap-2 mb-2">
            <select
              value={l.categorie}
              onChange={(e) => updateLine(idx, "categorie", e.target.value)}
              className="border px-1"
              disabled={!canEdit}
            >
              {categoryOptions}
            </select>
            <input
              type="text"
              placeholder="fiche_id"
              value={l.fiche_id}
              onChange={(e) => updateLine(idx, "fiche_id", e.target.value)}
              className="border px-1 flex-1"
              disabled={!canEdit}
            />
            <input
              type="number"
              value={l.portions}
              onChange={(e) => updateLine(idx, "portions", e.target.value)}
              className="border w-20 px-1"
              disabled={!canEdit}
            />
            {canEdit && (
              <button onClick={() => removeLine(idx)} className="text-red-500">X</button>
            )}
          </div>
          {l.cout_par_portion && (
            <div className="text-sm">{l.cout_par_portion.toFixed(2)} € / portion</div>
          )}
        </div>
      );
    }

    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Menu du {date}</h1>
        <div className="mb-4">Coût total: {total.toFixed(2)} €</div>
        {canEdit && (
          <button onClick={addLine} className="mb-4 border px-2 py-1 rounded">Ajouter une fiche</button>
        )}
        {lineElements}
        {canEdit && (
          <button onClick={save} className="mt-4 border px-3 py-1 rounded">Sauvegarder</button>
        )}
      </div>
    );
}
