import { useCostCenters } from "@/hooks/useCostCenters";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";
import * as XLSX from "xlsx";

export default function ParamCostCenters() {
  const {
    costCenters,
    fetchCostCenters,
    addCostCenter,
    updateCostCenter,
    deleteCostCenter,
    importCostCentersFromExcel,
  } = useCostCenters();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nom: "", actif: true, id: null });
  const [editMode, setEditMode] = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchCostCenters(); }, []);

  const filtered = costCenters.filter(c =>
    !search || c.nom.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = c => { setForm(c); setEditMode(true); };
  const handleDelete = async id => {
    if (window.confirm("Supprimer ce cost center ?")) {
      await deleteCostCenter(id); await fetchCostCenters();
      toast.success("Cost center supprimé.");
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (editMode) {
      await updateCostCenter(form.id, { nom: form.nom, actif: form.actif });
      toast.success("Cost center modifié !");
    } else {
      await addCostCenter({ nom: form.nom, actif: form.actif });
      toast.success("Cost center ajouté !");
    }
    setEditMode(false); setForm({ nom: "", actif: true, id: null });
    await fetchCostCenters();
  };

  const handleImport = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const rows = await importCostCentersFromExcel(file);
    for (const row of rows) {
      await addCostCenter({ nom: row.nom, actif: row.actif !== false });
    }
    await fetchCostCenters();
    e.target.value = null;
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filtered);
    XLSX.utils.book_append_sheet(wb, ws, "CostCenters");
    XLSX.writeFile(wb, "cost_centers.xlsx");
  };

  return (
    <div>
      <Toaster position="top-right" />
      <h2 className="font-bold text-xl mb-4">Cost Centers</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <label htmlFor="cc-nom" className="sr-only">Nom</label>
        <input
          id="cc-nom"
          className="input"
          placeholder="Nom"
          value={form.nom}
          onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
          required
        />
        <label htmlFor="cc-actif" className="flex items-center gap-1">
          <input
            id="cc-actif"
            type="checkbox"
            checked={form.actif}
            onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))}
          />
          Actif
        </label>
        <Button type="submit">{editMode ? "Modifier" : "Ajouter"}</Button>
        {editMode && (
          <Button variant="outline" type="button" onClick={() => { setEditMode(false); setForm({ nom: "", actif: true, id: null }); }}>Annuler</Button>
        )}
      </form>
      <label htmlFor="cc-search" className="sr-only">Recherche cost center</label>
      <input
        id="cc-search"
        className="input mb-2"
        placeholder="Recherche"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="flex gap-2 mb-2">
        <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
        <Button variant="outline" onClick={() => fileRef.current.click()}>Import Excel</Button>
        <input
          type="file"
          accept=".xlsx"
          ref={fileRef}
          onChange={handleImport}
          className="hidden"
          data-testid="import-cc-input"
        />
      </div>
      <table className="min-w-full bg-white rounded-xl shadow-md text-xs">
        <caption className="sr-only">Liste des cost centers</caption>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Actif</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.id}>
              <td>{c.nom}</td>
              <td>{c.actif ? "✅" : "❌"}</td>
              <td>
                <Button size="sm" variant="outline" onClick={() => handleEdit(c)}>Éditer</Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}>Supprimer</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
