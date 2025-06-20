import { useFamilles } from "@/hooks/useFamilles";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function ParamFamilles() {
  const { familles, fetchFamilles, addFamille, editFamille, deleteFamille } = useFamilles();
  const { mama_id } = useAuth();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nom: "", id: null });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (mama_id) fetchFamilles();
  }, [mama_id]);

  const filtered = familles.filter(f =>
    !search || f.nom.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = f => { setForm(f); setEditMode(true); };
  const handleDelete = async id => {
    if (window.confirm("Supprimer la famille ?")) {
      await deleteFamille(id); await fetchFamilles();
      toast.success("Famille supprimée.");
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (editMode) {
      await editFamille(form.id, { nom: form.nom });
      toast.success("Famille modifiée !");
    } else {
      await addFamille({ nom: form.nom });
      toast.success("Famille ajoutée !");
    }
    setEditMode(false); setForm({ nom: "", id: null }); await fetchFamilles();
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filtered);
    XLSX.utils.book_append_sheet(wb, ws, "Familles");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "familles.xlsx");
  };

  return (
    <div>
      <Toaster position="top-right" />
      <h2 className="font-bold text-xl mb-4">Familles</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          className="input"
          placeholder="Nom de la famille"
          value={form.nom}
          onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
          required
        />
        <Button type="submit">{editMode ? "Modifier" : "Ajouter"}</Button>
        {editMode && <Button variant="outline" type="button" onClick={() => { setEditMode(false); setForm({ nom: "", id: null }); }}>Annuler</Button>}
      </form>
      <input
        className="input mb-2"
        placeholder="Recherche"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <Button variant="outline" className="mb-2" onClick={exportExcel}>Export Excel</Button>
      <table className="min-w-full bg-white rounded-xl shadow-md text-xs">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(f => (
            <tr key={f.id}>
              <td>{f.nom}</td>
              <td>
                <Button size="sm" variant="outline" onClick={() => handleEdit(f)}>Modifier</Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(f.id)}>Supprimer</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
