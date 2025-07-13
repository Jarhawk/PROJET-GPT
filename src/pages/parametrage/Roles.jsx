// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@radix-ui/react-dialog";
import RoleForm from "./RoleForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Roles() {
  const { mama_id, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [editRole, setEditRole] = useState(null);
  const [filterActif, setFilterActif] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

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

  // Activer/désactiver
  const handleToggleActive = async role => {
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

  const filtered = roles.filter(r => {
    const matchSearch =
      r.nom?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchActif =
      filterActif === "all" ||
      r.actif === (filterActif === "actif");
    return matchSearch && matchActif;
  });
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
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
        <select
          className="input input-bordered"
          value={filterActif}
          onChange={e => setFilterActif(e.target.value)}
        >
          <option value="all">Tous</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
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
              <th className="px-2 py-1">Droits</th>
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
                  {(r.access_rights || []).map(k => (
                    <span
                      key={k}
                      className="inline-block bg-gray-200 text-gray-800 text-xs px-1 mr-1 rounded"
                    >
                      {k}
                    </span>
                  ))}
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
      <Dialog open={!!editRole} onOpenChange={v => !v && setEditRole(null)}>
        <DialogContent className="bg-glass backdrop-blur-lg text-white rounded-xl shadow-lg p-6 max-w-xl">
          <DialogTitle className="font-bold mb-2">
            {editRole?.id ? "Modifier le rôle" : "Nouveau rôle"}
          </DialogTitle>
          <DialogDescription className="sr-only">Formulaire rôle</DialogDescription>
          {editRole && (
            <RoleForm
              role={editRole}
              onClose={() => setEditRole(null)}
              onSaved={saved => {
                setEditRole(null);
                setRoles(rs => {
                  const idx = rs.findIndex(r => r.id === saved.id);
                  if (idx > -1) {
                    const arr = [...rs];
                    arr[idx] = saved;
                    return arr;
                  }
                  return [...rs, saved];
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
