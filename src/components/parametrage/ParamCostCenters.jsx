// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useCostCenters } from "@/hooks/useCostCenters";
import { useState, useEffect, useRef } from "react";
import useAuth from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
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
  const { mama_id, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nom: "", actif: true, id: null });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (mama_id) fetchCostCenters();
  }, [mama_id]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  const filtered = costCenters.filter(c =>
    !search || c.nom.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = c => { setForm(c); setEditMode(true); };
  const handleDelete = async id => {
    if (window.confirm("Supprimer ce cost center ?")) {
      try {
        await deleteCostCenter(id);
        await fetchCostCenters();
        toast.success("Centre de coût supprimé."); // ✅ Correction Codex
      } catch (err) {
        console.error("Erreur suppression cost center:", err);
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
        await updateCostCenter(form.id, { nom: form.nom, actif: form.actif });
        toast.success("Centre de coût modifié !"); // ✅ Correction Codex
      } else {
        await addCostCenter({ nom: form.nom, actif: form.actif });
        toast.success("Centre de coût ajouté !"); // ✅ Correction Codex
      }
      setEditMode(false);
      setForm({ nom: "", actif: true, id: null });
      await fetchCostCenters();
    } catch (err) {
      console.error("Erreur enregistrement cost center:", err);
      toast.error("Échec enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const rows = await importCostCentersFromExcel(file);
      for (const row of rows) {
        await addCostCenter({ nom: row.nom, actif: row.actif !== false });
      }
      await fetchCostCenters();
      toast.success("Centres de coûts importés"); // ✅ Correction Codex
    } catch (err) {
      console.error("Erreur import cost centers:", err);
      toast.error("Échec import");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filtered);
    XLSX.utils.book_append_sheet(wb, ws, "CostCenters");
    XLSX.writeFile(wb, "centres_de_cout.xlsx");
  };

  return (
    <div>
      <Toaster position="top-right" />
      <h2 className="font-bold text-xl mb-4">Centres de coûts</h2> // ✅ Correction Codex
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          className="input"
          placeholder="Nom"
          value={form.nom}
          onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
          required
        />
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={form.actif}
            onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))}
          />
          Actif
        </label>
        <Button type="submit" disabled={loading} className="flex items-center gap-2">
          {loading && <span className="loader-glass" />}
          {editMode ? "Modifier" : "Ajouter"}
        </Button>
        {editMode && (
          <Button
            variant="outline"
            type="button"
            onClick={() => { setEditMode(false); setForm({ nom: "", actif: true, id: null }); }}
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
      <div className="flex gap-2 mb-2">
        <Button variant="outline" onClick={exportExcel} disabled={loading}>Export Excel</Button>
        <Button variant="outline" onClick={() => fileRef.current.click()} disabled={loading}>Import Excel</Button>
        <input
          type="file"
          accept=".xlsx"
          ref={fileRef}
          onChange={handleImport}
          className="hidden"
          data-testid="import-cc-input"
        />
      </div>
      <TableContainer className="mt-2">
        <table className="min-w-full text-xs">
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
      </TableContainer>
    </div>
  );
}
