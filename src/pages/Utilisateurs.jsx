import { useEffect, useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import UtilisateurForm from "@/components/utilisateurs/UtilisateurForm";
import UtilisateurDetail from "@/components/utilisateurs/UtilisateurDetail";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion as Motion } from "framer-motion";

const PAGE_SIZE = 20;

export default function Utilisateurs() {
  const { users, fetchUsers, toggleUserActive, deleteUser } = useUsers();
  const [search, setSearch] = useState("");
  const [actifFilter, setActifFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const filtres = users.filter(u =>
    (!search || u.email?.toLowerCase().includes(search.toLowerCase())) &&
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
    await toggleUserActive(u.id, !u.actif);
    await fetchUsers();
    toast.success(u.actif ? "Utilisateur désactivé" : "Utilisateur réactivé");
  };

  const handleDelete = async (u) => {
    if (window.confirm(`Supprimer l'utilisateur ${u.email} ?`)) {
      await deleteUser(u.id);
      await fetchUsers();
      toast.success("Utilisateur supprimé.");
    }
  };

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <label className="sr-only" htmlFor="user-search">Recherche email</label>
        <input
          id="user-search"
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          placeholder="Recherche email"
        />
        <label className="sr-only" htmlFor="active-filter">Filtre actif</label>
        <select id="active-filter" className="input" value={actifFilter} onChange={e => setActifFilter(e.target.value)}>
          <option value="all">Tous</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          Ajouter un utilisateur
        </Button>
        <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
      </div>
      <Motion.table
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-full bg-white rounded-xl shadow-md"
      >
        <caption className="sr-only">Liste des utilisateurs</caption>
        <thead>
          <tr>
            <th className="px-4 py-2">Email</th>
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
                  className="font-semibold text-mamastockGold"
                  onClick={() => { setSelected(u); setShowDetail(true); }}
                >
                  {u.email}
                </Button>
              </td>
              <td className="border px-4 py-2">{u.role}</td>
              <td className="border px-4 py-2">
                <span className={u.actif ? "badge badge-admin" : "badge badge-user"}>
                  {u.actif ? "Actif" : "Inactif"}
                </span>
              </td>
              <td className="border px-4 py-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setSelected(u); setShowForm(true); }}>Modifier</Button>
                <Button size="sm" variant="outline" onClick={() => handleToggleActive(u)}>
                  {u.actif ? "Désactiver" : "Réactiver"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(u)}>Supprimer</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Motion.table>
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
          onClose={() => { setShowForm(false); setSelected(null); fetchUsers(); }}
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
