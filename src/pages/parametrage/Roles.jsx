import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Dialog, DialogContent } from "@radix-ui/react-dialog";
import PermissionsForm from "./PermissionsForm"; // adapte le chemin si besoin

export default function Roles() {
  const { mama_id, user_id, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [editRole, setEditRole] = useState(null);
  const [editPermsRole, setEditPermsRole] = useState(null);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!mama_id || authLoading) return;
    supabase
      .from("roles")
      .select("*")
      .eq("mama_id", mama_id)
      .order("nom", { ascending: true })
      .then(({ data }) => setRoles(data || []));
  }, [mama_id, authLoading]);

  // Sauvegarde (création/édition)
  const handleSave = async () => {
    if (!editRole.nom) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    setSaving(true);
    // Anti-doublon sur création
    if (!editRole.id) {
      const { data: existing } = await supabase
        .from("roles")
        .select("id")
        .eq("mama_id", mama_id)
        .eq("nom", editRole.nom)
        .maybeSingle();
      if (existing) {
        toast.error("Un rôle avec ce nom existe déjà !");
        setSaving(false);
        return;
      }
    }
    if (editRole.id) {
      // update
      const { error } = await supabase
        .from("roles")
        .update(editRole)
        .eq("id", editRole.id)
        .eq("mama_id", mama_id);
      if (!error) {
        setRoles(rs => rs.map(r => (r.id === editRole.id ? editRole : r)));
        setEditRole(null);
        toast.success("Rôle modifié !");
      } else {
        toast.error(error.message);
      }
    } else {
      // insert
      const { data, error } = await supabase
        .from("roles")
        .insert([{ ...editRole, mama_id, actif: true }])
        .select()
        .single();
      if (!error && data) {
        setRoles(rs => [...rs, data]);
        setEditRole(null);
        toast.success("Rôle créé !");
      } else {
        toast.error(error.message);
      }
    }
    setSaving(false);
  };

  // Activer/désactiver
  const handleToggleActive = async (role) => {
    const { error } = await supabase
      .from("roles")
      .update({ actif: !role.actif })
      .eq("id", role.id)
      .eq("mama_id", mama_id);
    if (!error) {
      setRoles(rs =>
        rs.map(r =>
          r.id === role.id ? { ...r, actif: !role.actif } : r
        )
      );
      toast.success("Statut modifié !");
    } else {
      toast.error(error.message);
    }
  };

  const filtered = roles.filter(
    r =>
      r.nom?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (authLoading) return <div className="p-8">Chargement...</div>;
  if (!mama_id) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto text-shadow">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">
        Gestion des rôles
      </h1>
      <div className="flex gap-4 mb-4 items-end">
        <input
          className="input input-bordered w-64"
          placeholder="Recherche nom, description"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={() => setEditRole({ nom: "", description: "", actif: true })}>
          + Nouveau rôle
        </Button>
      </div>
      <TableContainer className="mb-6">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Description</th>
              <th className="px-2 py-1">Actif</th>
              <th className="px-2 py-1">Actions</th>
              <th className="px-2 py-1">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(r => (
              <tr key={r.id}>
                <td className="px-2 py-1">{r.nom}</td>
                <td className="px-2 py-1">{r.description}</td>
                <td className="px-2 py-1">
                  <span
                    className={
                      r.actif
                        ? "inline-block bg-green-100 text-green-800 px-2 rounded-full"
                        : "inline-block bg-red-100 text-red-800 px-2 rounded-full"
                    }
                  >
                    {r.actif ? "Oui" : "Non"}
                  </span>
                </td>
                <td className="px-2 py-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditRole(r)}
                  >
                    Éditer
                  </Button>
                  <Button
                    size="sm"
                    variant={r.actif ? "destructive" : "outline"}
                    className="ml-2"
                    onClick={() => handleToggleActive(r)}
                  >
                    {r.actif ? "Désactiver" : "Activer"}
                  </Button>
                </td>
                <td className="px-2 py-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditPermsRole(r)}
                  >
                    Permissions
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
      {/* Pagination */}
      <div className="flex justify-end gap-2 mb-12">
        <Button
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}
        >
          Précédent
        </Button>
        <Button
          size="sm"
          disabled={page * PAGE_SIZE >= filtered.length}
          onClick={() => setPage(p => p + 1)}
        >
          Suivant
        </Button>
      </div>
      {/* Modale création/édition */}
      <Dialog open={!!editRole} onOpenChange={v => !v && setEditRole(null)}>
        <DialogContent className="bg-glass backdrop-blur-lg text-white rounded-xl shadow-lg p-6 max-w-md">
          <h2 className="font-bold mb-2">
            {editRole?.id ? "Modifier le rôle" : "Nouveau rôle"}
          </h2>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-3"
          >
            <div>
              <label>Nom</label>
              <input
                className="input input-bordered w-full"
                value={editRole?.nom || ""}
                onChange={e =>
                  setEditRole(r => ({ ...r, nom: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label>Description</label>
              <textarea
                className="input input-bordered w-full"
                value={editRole?.description || ""}
                rows={2}
                onChange={e =>
                  setEditRole(r => ({ ...r, description: e.target.value }))
                }
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <span>
                  <span className="animate-spin mr-2">⏳</span>Enregistrement…
                </span>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modale permissions */}
      {editPermsRole && (
        <Dialog open={!!editPermsRole} onOpenChange={v => !v && setEditPermsRole(null)}>
          <DialogContent className="bg-glass backdrop-blur-lg text-white rounded-xl shadow-lg p-6 max-w-xl">
              {/* Passe bien tout l'objet ici */}
              <PermissionsForm
                role={editPermsRole}
                onClose={() => setEditPermsRole(null)}
              afterSaveLog={async () => {
                // Log en base le changement de permissions
                await supabase.from("user_logs").insert([{
                  mama_id,
                  user_id: null,
                  action: "Modification permissions",
                  details: { role: editPermsRole.nom, by: user_id },
                  done_by: user_id,
                }]);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
