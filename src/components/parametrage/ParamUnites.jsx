import { useUnites } from "@/hooks/useUnites";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function ParamUnites() {
  const { unites, fetchUnites, addUnite, editUnite, deleteUnite } = useUnites();
  const { mama_id } = useAuth();
  const [form, setForm] = useState({ nom: "", id: null });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (mama_id) fetchUnites();
  }, [mama_id]);

  const handleEdit = u => { setForm(u); setEditMode(true); };
  const handleDelete = async id => {
    if (window.confirm("Supprimer l’unité ?")) {
      try {
        await deleteUnite(id);
        await fetchUnites();
        toast.success("Unité supprimée.");
      } catch (err) {
        console.error("Erreur suppression unité:", err);
        toast.error("Échec suppression");
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nom.trim()) return toast.error("Nom requis");
    try {
      if (editMode) {
        await editUnite(form.id, { nom: form.nom });
        toast.success("Unité modifiée !");
      } else {
        await addUnite({ nom: form.nom });
        toast.success("Unité ajoutée !");
      }
      setEditMode(false);
      setForm({ nom: "", id: null });
      await fetchUnites();
    } catch (err) {
      console.error("Erreur enregistrement unité:", err);
      toast.error("Échec enregistrement");
    }
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(unites);
    XLSX.utils.book_append_sheet(wb, ws, "Unités");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "unites.xlsx");
  };

  return (
    <div>
      <Toaster position="top-right" />
      <h2 className="font-bold text-xl mb-4">Unités</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          className="input"
          placeholder="Nom de l’unité"
          value={form.nom}
          onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
          required
        />
        <Button type="submit">{editMode ? "Modifier" : "Ajouter"}</Button>
        {editMode && <Button variant="outline" type="button" onClick={() => { setEditMode(false); setForm({ nom: "", id: null }); }}>Annuler</Button>}
      </form>
      <Button variant="outline" className="mb-2" onClick={exportExcel}>Export Excel</Button>
      <table className="min-w-full bg-white rounded-xl shadow-md text-xs">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {unites.map(u => (
            <tr key={u.id}>
              <td>{u.nom}</td>
              <td>
                <Button size="sm" variant="outline" onClick={() => handleEdit(u)}>Modifier</Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(u.id)}>Supprimer</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
