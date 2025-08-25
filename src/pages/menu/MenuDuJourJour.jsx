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
    fetchDay(date).then(({ lignes }) => setLignes(lignes || []));
  }, [date, fetchDay]);

  const canEdit = access_rights?.menus_jour?.peut_modifier;

  const addLine = () => {
    setLignes([...lignes, { categorie: "entree", fiche_id: "", portions: 1 }]);
  };

  const updateLine = (idx, field, value) => {
    setLignes(lignes.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const removeLine = (idx) => {
    setLignes(lignes.filter((_, i) => i !== idx));
  };

  const save = async () => {
    await createOrUpdateMenu(date, lignes);
  };

  const total = lignes.reduce((s, l) => s + Number(l.cout_ligne_total || 0), 0);

  if (!access_rights?.menus_jour?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Menu du {date}</h1>
      <div className="mb-4">Coût total: {total.toFixed(2)} €</div>
      {canEdit && (
        <button onClick={addLine} className="mb-4 border px-2 py-1 rounded">Ajouter une fiche</button>
      )}
      {lignes.map((l, idx) => (
        <div key={idx} className="border p-2 mb-2 rounded">
          <div className="flex gap-2 mb-2">
            <select
              value={l.categorie}
              onChange={(e) => updateLine(idx, "categorie", e.target.value)}
              className="border px-1"
              disabled={!canEdit}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
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
      ))}
      {canEdit && (
        <button onClick={save} className="mt-4 border px-3 py-1 rounded">Sauvegarder</button>
      )}
    </div>
  );
}
