// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useMenuDuJour } from "@/hooks/useMenuDuJour";
import { useFiches } from "@/hooks/useFiches";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

const CATEGORIES = ["entrée", "plat", "dessert"];
const COST_THRESHOLD = 5;

export default function MenuDuJour() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [menu, setMenu] = useState({});
  const { fetchMenuForDate, setFicheForCategorie, setPortions, removeFicheFromMenu, reloadSavedFiches } =
    useMenuDuJour();
  const { fiches = [], fetchFiches } = useFiches();

  useEffect(() => {
    fetchFiches();
  }, [fetchFiches]);

  useEffect(() => {
    fetchMenuForDate(date).then((data) => setMenu(data));
  }, [date, fetchMenuForDate]);

  const handleFicheChange = (cat, ficheId) => {
    const fiche = fiches.find((f) => f.id === ficheId);
    const cout_unitaire = fiche ? Number(fiche.cout_total || 0) / Number(fiche.portions || 1) : 0;
    setMenu((m) => ({
      ...m,
      [cat]: {
        ...m[cat],
        fiche_id: ficheId,
        nom: fiche?.nom,
        cout_unitaire,
        portions: m[cat]?.portions || 1,
      },
    }));
  };

  const handlePortionsChange = (cat, portions) => {
    setMenu((m) => ({
      ...m,
      [cat]: { ...m[cat], portions: Number(portions) },
    }));
  };

  const saveCategorie = async (cat) => {
    const item = menu[cat];
    if (!item?.fiche_id) return;
    await setFicheForCategorie(date, cat, item.fiche_id);
    await setPortions(date, cat, item.portions || 1);
  };

  const removeCategorie = async (cat) => {
    setMenu((m) => ({ ...m, [cat]: {} }));
    await removeFicheFromMenu(date, cat);
  };

  const reload = async () => {
    const data = await reloadSavedFiches(date);
    setMenu(data || {});
  };

  const exportExcel = () => {
    const rows = CATEGORIES.map((cat) => {
      const item = menu[cat] || {};
      const total = (item.portions || 0) * (item.cout_unitaire || 0);
      return {
        categorie: cat,
        fiche: item.nom || "",
        portions: item.portions || 0,
        cout_par_portion: item.cout_unitaire || 0,
        total,
      };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Menu");
    XLSX.writeFile(wb, `menu_${date}.xlsx`);
  };

  const globalCostPerPortion = CATEGORIES.reduce(
    (sum, cat) => sum + (menu[cat]?.cout_unitaire || 0),
    0
  );

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Menu du jour</h1>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border p-1"
      />
      <table className="mt-4 w-full border text-sm">
        <thead>
          <tr>
            <th>Catégorie</th>
            <th>Fiche</th>
            <th>Portions</th>
            <th>Coût/portion</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((cat) => {
            const item = menu[cat] || {};
            const total = (item.portions || 0) * (item.cout_unitaire || 0);
            return (
              <tr key={cat} className="text-center">
                <td>{cat}</td>
                <td>
                  <select
                    value={item.fiche_id || ""}
                    onChange={(e) => handleFicheChange(cat, e.target.value)}
                  >
                    <option value="">Choisir</option>
                    {fiches.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={item.portions || 0}
                    onChange={(e) => handlePortionsChange(cat, e.target.value)}
                    className="w-16 border"
                  />
                </td>
                <td>{item.cout_unitaire != null ? item.cout_unitaire.toFixed(2) : "-"}</td>
                <td>{total.toFixed(2)}</td>
                <td className="space-x-2">
                  <Button size="sm" onClick={() => saveCategorie(cat)}>
                    Modifier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => removeCategorie(cat)}>
                    X
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-2 font-semibold">Total global: {globalCostPerPortion.toFixed(2)} €</div>
      {globalCostPerPortion > COST_THRESHOLD && (
        <div role="alert" className="text-red-600">
          Coût global élevé
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Button onClick={reload}>Recharger fiches</Button>
        <Button onClick={exportExcel}>Exporter Excel</Button>
      </div>
    </div>
  );
}
