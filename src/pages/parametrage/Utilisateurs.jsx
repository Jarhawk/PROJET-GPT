// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import useAuth from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useMamas } from "@/hooks/useMamas";
import UtilisateurForm from "./UtilisateurForm";
import UtilisateurDetail from "@/components/utilisateurs/UtilisateurDetail";
import UtilisateurRow from "@/components/parametrage/UtilisateurRow";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Toaster, toast } from "react-hot-toast";
import { motion as Motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const PAGE_SIZE = 50;

export default function Utilisateurs() {
  const {
    users,
    loading,
    error,
    fetchUsers,
    toggleUserActive,
    exportUsersToExcel,
    exportUsersToCSV,
  } = useUtilisateurs();
  const { mama_id, loading: authLoading, hasAccess } = useAuth();
  const { roles, fetchRoles } = useRoles();
  const { mamas, fetchMamas } = useMamas();
  const [search, setSearch] = useState("");
  const [actifFilter, setActifFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nom");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const canEdit = hasAccess("utilisateurs", "peut_modifier");

  const refreshList = useCallback(() => {
    fetchUsers({
      search,
      actif: actifFilter === "all" ? null : actifFilter === "true",
    });
  }, [fetchUsers, search, actifFilter]);

  useEffect(() => {
    if (!authLoading && mama_id) {
      refreshList();
      fetchRoles();
      fetchMamas();
    }
  }, [authLoading, mama_id, refreshList, fetchRoles, fetchMamas]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  const mapped = users.map(u => ({
    ...u,
    mamaNom: mamas.find(m => m.id === u.mama_id)?.nom || u.mama_id,
    roleNom: roles.find(r => r.id === u.role_id)?.nom || u.role?.nom || "",
    role: roles.find(r => r.id === u.role_id)?.nom || u.role?.nom || "",
  }));
  const filtres = mapped.filter(u =>
    (!search ||
      u.nom?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())) &&
    (actifFilter === "all" || (actifFilter === "true" ? u.actif : !u.actif)) &&
    (roleFilter === "all" || u.roleNom === roleFilter)
  ).sort((a, b) => {
    if (sortBy === "mama") return a.mamaNom.localeCompare(b.mamaNom);
    if (sortBy === "role") return a.roleNom.localeCompare(b.roleNom);
    if (sortBy === "email") return (a.email || "").localeCompare(b.email || "");
    return a.nom.localeCompare(b.nom);
  });
  const nbPages = Math.ceil(filtres.length / PAGE_SIZE);
  const paged = filtres.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  const handleToggleActive = async (u) => {
    await toggleUserActive(u.id, !u.actif);
    await refreshList();
    toast.success(u.actif ? "Utilisateur désactivé" : "Utilisateur réactivé");
  };


  return (
    <div className="p-6 container mx-auto text-shadow">
      <Toaster position="top-right" />
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="search"
          value={search}
          onChange={e => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="input"
          placeholder="Recherche nom"
        />
        <select
          className="input"
          value={actifFilter}
          onChange={e => {
            setPage(1);
            setActifFilter(e.target.value);
          }}
        >
          <option value="all">Tous</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
        <select
          className="input"
          value={roleFilter}
          onChange={e => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
        >
          <option value="all">Tous rôles</option>
          {roles.map(r => (
            <option key={r.nom} value={r.nom}>{r.nom}</option>
          ))}
        </select>
        {canEdit && (
          <Button
            onClick={() => {
              setSelected(null);
              setShowForm(true);
            }}
          >
            Ajouter un utilisateur
          </Button>
        )}
        <select
          className="input"
          value={sortBy}
          onChange={e => {
            setPage(1);
            setSortBy(e.target.value);
          }}
        >
          <option value="nom">Tri nom</option>
          <option value="mama">Tri Mama</option>
          <option value="role">Tri rôle</option>
          <option value="email">Tri email</option>
        </select>
        <Button variant="outline" onClick={() => exportUsersToExcel(filtres)}>Export Excel</Button>
        <Button variant="outline" onClick={() => exportUsersToCSV(filtres)}>Export CSV</Button>
      </div>
      {error && (
        <div className="text-red-500 mb-2">{error.message}</div>
      )}
      {loading && <LoadingSpinner message="Chargement..." />}
      <TableContainer className="mb-4">
        <Motion.table
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-w-full text-white"
        >
        <thead>
          <tr>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Rôle</th>
            <th className="px-4 py-2">Mama</th>
            <th className="px-4 py-2">Actif</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((u) => (
            <UtilisateurRow
              key={u.id}
              utilisateur={u}
              canEdit={canEdit}
              onEdit={(user) => {
                setSelected(user);
                setShowForm(true);
              }}
              onToggleActive={() => handleToggleActive(u)}
            />
          ))}
          {paged.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-400">
                Aucun utilisateur.
              </td>
            </tr>
          )}
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
      {showForm && (
        <UtilisateurForm
          utilisateur={selected}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
            refreshList();
          }}
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
