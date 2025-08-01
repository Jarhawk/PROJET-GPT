// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useUnites } from "@/hooks/useUnites";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function ParamUnites() {
  const { unites, fetchUnites, addUnite, updateUnite, deleteUnite } = useUnites();
  const { mama_id, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ nom: "", id: null });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mama_id) fetchUnites();
  }, [mama_id]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  const handleEdit = u => { setForm(u); setEditMode(true); };
  const handleDelete = async id => {
    if (window.confirm("Désactiver l’unité ?")) {
      try {
        await deleteUnite(id);
        await fetchUnites();
        toast.success("Unité désactivée.");
      } catch (err) {
        console.error("Erreur suppression unité:", err);
        toast.error("Échec suppression");
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    if (!form.nom.trim()) return toast.error("Nom requis");
    setLoading(true);
    try {
      if (editMode) {
        await updateUnite(form.id, form.nom);
        toast.success("Unité modifiée !");
      } else {
        await addUnite(form.nom);
        toast.success("Unité ajoutée !");
      }
      setEditMode(false);
      setForm({ nom: "", id: null });
      await fetchUnites();
    } catch (err) {
      console.error("Erreur enregistrement unité:", err);
      toast.error("Échec enregistrement");
    } finally {
      setLoading(false);
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
          className="form-input"
          placeholder="Nom de l’unité"
          value={form.nom}
          onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
          required
        />
        <Button type="submit" disabled={loading} className="flex items-center gap-2">
          {loading && <span className="loader-glass" />}
          {editMode ? "Modifier" : "Ajouter"}
        </Button>
        {editMode && (
          <Button
            variant="outline"
            type="button"
            onClick={() => { setEditMode(false); setForm({ nom: "", id: null }); }}
            disabled={loading}
          >
            Annuler
          </Button>
        )}
      </form>
      <Button variant="outline" className="mb-2" onClick={exportExcel}>Export Excel</Button>
      <TableContainer className="mt-2">
        <table className="min-w-full text-xs">
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
                  <Button size="sm" variant="outline" onClick={() => handleDelete(u.id)}>Archiver</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
