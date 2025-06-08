import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@radix-ui/react-dialog";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function Utilisateurs() {
  const { isAuthenticated, claims } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState([]);
  const [logUser, setLogUser] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  useEffect(() => {
    if (!claims?.mama_id) return;
    supabase
      .from("users")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .then(({ data }) => setUsers(data || []));
    supabase
      .from("roles")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .then(({ data }) => setRoles(data || []));
  }, [claims?.mama_id]);

  // Logs pour un user
  const handleShowLogs = async (user) => {
    setLogUser(user);
    const { data } = await supabase
      .from("user_logs")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .eq("user_id", user.id)
      .order("done_at", { ascending: false });
    setLogs(data || []);
  };

  // Désactiver/réactiver user (avec log)
  const handleToggleActive = async (user) => {
    const { error } = await supabase
      .from("users")
      .update({ actif: !user.actif })
      .eq("id", user.id)
      .eq("mama_id", claims.mama_id);
    if (!error) {
      setUsers(users =>
        users.map(u =>
          u.id === user.id ? { ...u, actif: !user.actif } : u
        )
      );
      // log action
      await supabase.from("user_logs").insert([{
        mama_id: claims.mama_id,
        user_id: user.id,
        action: !user.actif ? "Activation" : "Désactivation",
        details: { by: claims.user_id },
        done_by: claims.user_id,
      }]);
      toast.success("Modification enregistrée !");
    } else {
      toast.error(error.message);
    }
  };

  // Modifier rôle (avec log)
  const handleChangeRole = async (user, newRole) => {
    if (user.role === newRole) return;
    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", user.id)
      .eq("mama_id", claims.mama_id);
    if (!error) {
      setUsers(users =>
        users.map(u =>
          u.id === user.id ? { ...u, role: newRole } : u
        )
      );
      await supabase.from("user_logs").insert([{
        mama_id: claims.mama_id,
        user_id: user.id,
        action: "Changement de rôle",
        details: { old: user.role, new: newRole, by: claims.user_id },
        done_by: claims.user_id,
      }]);
      toast.success("Rôle modifié !");
    } else {
      toast.error(error.message);
    }
  };

  // Export Excel/PDF
  const handleExport = (type) => {
    const exportData = users.map(u => ({
      Email: u.email,
      Rôle: u.role,
      "Société": u.mama_id,
      Actif: u.actif ? "Oui" : "Non"
    }));
    if (type === "excel") {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Utilisateurs");
      XLSX.writeFile(wb, "Utilisateurs.xlsx");
      toast.success("Export Excel généré !");
    } else {
      const doc = new jsPDF();
      doc.text("Liste utilisateurs", 10, 12);
      doc.autoTable({
        startY: 20,
        head: [["Email", "Rôle", "Société", "Actif"]],
        body: exportData.map(d => [d.Email, d.Rôle, d.Société, d.Actif]),
        styles: { fontSize: 9 },
      });
      doc.save("Utilisateurs.pdf");
      toast.success("Export PDF généré !");
    }
  };

  const filtered = users.filter(
    u =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">
        Gestion des utilisateurs & accès
      </h1>
      <div className="flex gap-4 mb-4 items-end">
        <input
          className="input input-bordered w-64"
          placeholder="Recherche email, rôle"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={() => handleExport("excel")}>Export Excel</Button>
        <Button onClick={() => handleExport("pdf")}>Export PDF</Button>
      </div>
      <div className="bg-white shadow rounded-xl overflow-x-auto mb-6">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Email</th>
              <th className="px-2 py-1">Rôle</th>
              <th className="px-2 py-1">Actif</th>
              <th className="px-2 py-1">Logs</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(u => (
              <tr key={u.id}>
                <td className="px-2 py-1">{u.email}</td>
                <td className="px-2 py-1">
                  <select
                    className="input input-bordered"
                    value={u.role}
                    onChange={e => handleChangeRole(u, e.target.value)}
                  >
                    {roles.map(r => (
                      <option key={r.nom} value={r.nom}>
                        {r.nom}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <span
                    className={
                      u.actif
                        ? "inline-block bg-green-100 text-green-800 px-2 rounded-full"
                        : "inline-block bg-red-100 text-red-800 px-2 rounded-full"
                    }
                  >
                    {u.actif ? "Oui" : "Non"}
                  </span>
                </td>
                <td className="px-2 py-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" onClick={() => handleShowLogs(u)}>
                        Logs
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white rounded-xl shadow-lg p-6 max-w-lg">
                      <h3 className="font-bold mb-2">
                        Logs utilisateur : {u.email}
                      </h3>
                      <table className="w-full text-xs">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Action</th>
                            <th>By</th>
                            <th>Détail</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logUser?.id === u.id && logs.map((l, i) => (
                            <tr key={i}>
                              <td>{l.done_at?.slice(0, 16).replace("T", " ")}</td>
                              <td>{l.action}</td>
                              <td>{l.done_by?.slice(0, 8) + "..."}</td>
                              <td>
                                {l.details ? JSON.stringify(l.details) : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DialogContent>
                  </Dialog>
                </td>
                <td className="px-2 py-1">
                  <Button
                    size="sm"
                    variant={u.actif ? "destructive" : "secondary"}
                    onClick={() => handleToggleActive(u)}
                  >
                    {u.actif ? "Désactiver" : "Réactiver"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    </div>
  );
}
