// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMenuDuJour } from "@/hooks/useMenuDuJour";

export default function MenuDuJourJour() {
  const { date } = useParams();
  const { fetchDay, createOrUpdateMenu, addLigne, removeLigne } = useMenuDuJour();
  const [menu, setMenu] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [form, setForm] = useState({ categorie: "entree", fiche_id: "", portions: 1 });

  const load = async () => {
    const { menu, lignes } = await fetchDay(date);
    setMenu(menu);
    setLignes(lignes || []);
  };

  useEffect(() => {
    load();
  }, [date]);

  const handleAdd = async () => {
    if (!menu) {
      await createOrUpdateMenu(date, [form]);
    } else {
      await addLigne(menu.id, form);
    }
    setForm({ categorie: "entree", fiche_id: "", portions: 1 });
    await load();
  };

  const handleRemove = async (id) => {
    await removeLigne(id);
    await load();
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-semibold text-lg">Menu du {date}</h2>
      <div>
        <label>Catégorie </label>
        <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
          <option value="entree">Entrée</option>
          <option value="plat">Plat</option>
          <option value="dessert">Dessert</option>
          <option value="boisson">Boisson</option>
        </select>
        <input
          placeholder="fiche_id"
          value={form.fiche_id}
          onChange={(e) => setForm({ ...form, fiche_id: e.target.value })}
          className="border ml-2"
        />
        <input
          type="number"
          min="1"
          value={form.portions}
          onChange={(e) => setForm({ ...form, portions: Number(e.target.value) })}
          className="border ml-2 w-16"
        />
        <button onClick={handleAdd} className="ml-2 px-2 border rounded">
          Ajouter
        </button>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Catégorie</th>
            <th className="text-left">Fiche</th>
            <th>Portions</th>
            <th>Coût</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.id}>
              <td>{l.categorie}</td>
              <td>{l.fiche_id}</td>
              <td className="text-center">{l.portions}</td>
              <td className="text-right">{l.cout_ligne_total?.toFixed(2)}</td>
              <td className="text-right">
                <button onClick={() => handleRemove(l.id)} className="text-red-600">X</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
