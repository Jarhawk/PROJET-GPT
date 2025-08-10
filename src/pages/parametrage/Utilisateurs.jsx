// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from "@/hooks/useRoles";
import UtilisateurForm from "@/components/Utilisateurs/UtilisateurForm";
import UtilisateurRow from "@/components/Utilisateurs/UtilisateurRow";
import { Button } from "@/components/ui/button";
import ListingContainer from "@/components/ui/ListingContainer";
import PaginationFooter from "@/components/ui/PaginationFooter";
import TableHeader from "@/components/ui/TableHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const PAGE_SIZE = 50;

export default function Utilisateurs() {
  const { users, loading, error, getUtilisateurs, toggleUserActive } = useUtilisateurs();
  const { mama_id, role, loading: authLoading } = useAuth();
  const { roles, fetchRoles } = useRoles();
  const [search, setSearch] = useState("");
  const [actifFilter, setActifFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const refreshList = useCallback(() => {
    getUtilisateurs({
      search,
      actif: actifFilter === "all" ? null : actifFilter === "true",
    });
  }, [getUtilisateurs, search, actifFilter]);

  useEffect(() => {
    if (!authLoading && mama_id) {
      refreshList();
      fetchRoles();
    }
  }, [authLoading, mama_id, refreshList, fetchRoles]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id || role !== "admin") return null;

  const filtres = users.filter(u =>
    (!search || u.email?.toLowerCase().includes(search.toLowerCase())) &&
    (actifFilter === "all" || (actifFilter === "true" ? u.actif : !u.actif)) &&
    (roleFilter === "all" || u.role === roleFilter)
  );
  const nbPages = Math.ceil(filtres.length / PAGE_SIZE);
  const paged = filtres.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 container mx-auto text-shadow">
      <TableHeader>
        <input
          type="search"
          value={search}
          onChange={e => { setPage(1); setSearch(e.target.value); }}
          className="form-input"
          placeholder="Recherche email"
        />
        <select
          className="form-input"
          value={actifFilter}
          onChange={e => { setPage(1); setActifFilter(e.target.value); }}
        >
          <option value="all">Tous</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
        <select
          className="form-input"
          value={roleFilter}
          onChange={e => { setPage(1); setRoleFilter(e.target.value); }}
        >
          <option value="all">Tous rôles</option>
          {roles.map(r => (
            <option key={r.nom} value={r.nom}>{r.nom}</option>
          ))}
        </select>
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>Ajouter un utilisateur</Button>
      </TableHeader>
      {error && <div className="text-red-500 mb-2">{error.message}</div>}
      {loading && <LoadingSpinner message="Chargement..." />}
      <ListingContainer className="mb-4">
        <table className="min-w-full text-white">
          <thead>
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Rôle</th>
              <th className="px-4 py-2">Actif</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(u => (
              <UtilisateurRow
                key={u.id}
                utilisateur={u}
                canEdit
                onEdit={(user) => { setSelected(user); setShowForm(true); }}
                onToggleActive={() => { toggleUserActive(u.id, !u.actif); refreshList(); }}
              />
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-400">Aucun utilisateur.</td>
              </tr>
            )}
          </tbody>
        </table>
      </ListingContainer>
      <PaginationFooter page={page} pages={nbPages} onPageChange={setPage} />
      {showForm && (
        <UtilisateurForm
          utilisateur={selected}
          onClose={() => { setShowForm(false); setSelected(null); refreshList(); }}
        />
      )}
    </div>
  );
}
