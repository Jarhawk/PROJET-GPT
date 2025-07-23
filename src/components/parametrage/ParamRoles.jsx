// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toaster, toast } from "react-hot-toast";

export default function ParamRoles() {
  const { roles, fetchRoles, addRole, editRole, deleteRole } = useRoles();
  const { mama_id, role, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ nom: "", id: null });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mama_id || role === "superadmin") fetchRoles();
  }, [mama_id, role]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  const handleEdit = r => { setForm(r); setEditMode(true); };
  const handleDelete = async id => {
    if (window.confirm("Supprimer le rôle ?")) {
      try {
        await deleteRole(id);
        await fetchRoles();
        toast.success("Rôle supprimé.");
      } catch (err) {
        console.error("Erreur suppression rôle:", err);
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
        await editRole(form.id, { nom: form.nom });
        toast.success("Rôle modifié !");
      } else {
        await addRole({ nom: form.nom });
        toast.success("Rôle ajouté !");
      }
      setEditMode(false);
      setForm({ nom: "", id: null });
      await fetchRoles();
    } catch (err) {
      console.error("Erreur enregistrement rôle:", err);
      toast.error("Échec enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      <h2 className="font-bold text-xl mb-4">Rôles</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          className="input"
          placeholder="Nom du rôle"
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
      <TableContainer className="mt-2">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id}>
                <td>{r.nom}</td>
                <td>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(r)}>Modifier</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(r.id)}>Supprimer</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
