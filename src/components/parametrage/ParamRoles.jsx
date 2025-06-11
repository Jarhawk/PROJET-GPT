import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";

export default function ParamRoles() {
  const { roles, fetchRoles, addRole, editRole, deleteRole } = useRoles();
  const [form, setForm] = useState({ nom: "", id: null });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => { fetchRoles(); }, []);

  const handleEdit = r => { setForm(r); setEditMode(true); };
  const handleDelete = async id => {
    if (window.confirm("Supprimer le rôle ?")) {
      await deleteRole(id); await fetchRoles();
      toast.success("Rôle supprimé.");
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (editMode) {
      await editRole(form.id, { nom: form.nom });
      toast.success("Rôle modifié !");
    } else {
      await addRole({ nom: form.nom });
      toast.success("Rôle ajouté !");
    }
    setEditMode(false); setForm({ nom: "", id: null }); await fetchRoles();
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
        <Button type="submit">{editMode ? "Modifier" : "Ajouter"}</Button>
        {editMode && <Button variant="outline" type="button" onClick={() => { setEditMode(false); setForm({ nom: "", id: null }); }}>Annuler</Button>}
      </form>
      <table className="min-w-full bg-white rounded-xl shadow-md text-xs">
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
    </div>
  );
}
