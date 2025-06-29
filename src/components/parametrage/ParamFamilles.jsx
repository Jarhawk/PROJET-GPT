// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useFamilles } from "@/hooks/useFamilles";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function ParamFamilles() {
  const {
    familles,
    fetchFamilles,
    addFamille,
    updateFamille,
    batchDeleteFamilles,
  } = useFamilles();
  const { mama_id } = useAuth();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nom: "", id: null });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mama_id) fetchFamilles();
  }, [mama_id]);

  const filtered = familles.filter(f =>
    !search || f.nom.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = f => { setForm(f); setEditMode(true); };
  const handleDelete = async id => {
    if (window.confirm("Supprimer la famille ?")) {
      try {
        await batchDeleteFamilles([id]);
        await fetchFamilles();
        toast.success("Famille supprimée.");
      } catch (err) {
        console.error("Erreur suppression famille:", err);
        toast.error("Échec suppression");
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    if (!form.nom.trim()) return toast.error("Nom requis");
    try {
      if (editMode) {
        await updateFamille(form.id, form.nom);
        toast.success("Famille modifiée !");
      } else {
        await addFamille(form.nom);
        toast.success("Famille ajoutée !");
      }
      setEditMode(false);
      setForm({ nom: "", id: null });
      await fetchFamilles();
    } catch (err) {
      console.error("Erreur enregistrement famille:", err);
      toast.error("Échec enregistrement");
    } finally {
      setLoading(false);
    }
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
        <Button type="submit" disabled={loading}>{editMode ? "Modifier" : "Ajouter"}</Button>
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
      <input
        className="input mb-2"
        placeholder="Recherche"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
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
      </TableContainer>
    </div>
  );
}
