// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import useAuth from "@/hooks/useAuth";
import UtilisateurForm from "@/components/utilisateurs/UtilisateurForm";
import UtilisateurDetail from "@/components/utilisateurs/UtilisateurDetail";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Navigate } from "react-router-dom";
import GlassCard from "@/components/ui/GlassCard";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion as Motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const PAGE_SIZE = 20;

export default function Utilisateurs() {
  const { users, fetchUsers, toggleUserActive, deleteUser } = useUtilisateurs();
  const {
    mama_id,
    loading: authLoading,
    access_rights,
    isSuperadmin,
  } = useAuth();
  const canEdit = isSuperadmin || access_rights?.utilisateurs?.peut_modifier;
  const [search, setSearch] = useState("");
  const [actifFilter, setActifFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const getParams = () => ({
    search,
    actif: actifFilter === "all" ? null : actifFilter === "true",
  });

  useEffect(() => {
    if (!authLoading && mama_id) fetchUsers(getParams());
  }, [authLoading, mama_id, fetchUsers, search, actifFilter]);

  const filtres = users.filter(u =>
    (!search || u.nom?.toLowerCase().includes(search.toLowerCase())) &&
    (actifFilter === "all" || (actifFilter === "true" ? u.actif : !u.actif))
  );
  const nbPages = Math.ceil(filtres.length / PAGE_SIZE);
  const paged = filtres.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filtres);
    XLSX.utils.book_append_sheet(wb, ws, "Utilisateurs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "utilisateurs.xlsx");
  };

  const handleToggleActive = async (u) => {
    await toggleUserActive(u.id, !u.actif, { params: getParams() });
    await fetchUsers(getParams());
    toast.success(u.actif ? "Utilisateur désactivé" : "Utilisateur réactivé");
  };

  const handleDelete = async (u) => {
    if (window.confirm(`Supprimer l'utilisateur ${u.nom} ?`)) {
      await deleteUser(u.id, { params: getParams() });
      await fetchUsers(getParams());
      toast.success("Utilisateur supprimé.");
    }
  };

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!access_rights?.utilisateurs?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="p-6 container mx-auto text-shadow">
      <Toaster position="top-right" />
      <GlassCard className="p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            placeholder="Recherche nom"
          />
          <select className="input" value={actifFilter} onChange={e => setActifFilter(e.target.value)}>
            <option value="all">Tous</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
          {canEdit && (
            <Button onClick={() => { setSelected(null); setShowForm(true); }}>
              Ajouter un utilisateur
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
          )}
        </div>
      </GlassCard>
      <TableContainer className="mb-4">
        <Motion.table
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-w-full text-white"
        >
        <thead>
          <tr>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Rôle</th>
            <th className="px-4 py-2">Actif</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(u => (
            <tr key={u.id}>
              <td className="border px-4 py-2">
                <Button
                  variant="link"
                  className="font-semibold text-white"
                  onClick={() => { setSelected(u); setShowDetail(true); }}
                >
                  {u.nom}
                </Button>
              </td>
              <td className="border px-4 py-2">{u.role}</td>
              <td className="border px-4 py-2">
                <span className={u.actif ? "badge badge-admin" : "badge badge-user"}>
                  {u.actif ? "Actif" : "Inactif"}
                </span>
              </td>
              <td className="border px-4 py-2 flex gap-2">
                {canEdit && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => { setSelected(u); setShowForm(true); }}>Modifier</Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleActive(u)}>
                      {u.actif ? "Désactiver" : "Réactiver"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(u)}>Supprimer</Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        </Motion.table>
      </TableContainer>
      <div className="mt-4 flex gap-2">
        {Array.from({ length: nbPages }, (_, i) => (
          <Button
            key={i + 1}
            size="sm"
            variant={page === i + 1 ? "default" : "outline"}
            onClick={() => setPage(i + 1)}
          >{i + 1}</Button>
        ))}
      </div>
      {canEdit && showForm && (
        <UtilisateurForm
          utilisateur={selected}
          onClose={() => { setShowForm(false); setSelected(null); fetchUsers(getParams()); }}
        />
      )}
      {showDetail && selected && (
        <UtilisateurDetail
          utilisateur={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
        />
      )}
    </div>
  );
}
