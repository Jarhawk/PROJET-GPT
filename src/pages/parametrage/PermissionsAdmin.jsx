import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@radix-ui/react-dialog";
import PermissionsForm from "./PermissionsForm";
import toast, { Toaster } from "react-hot-toast";

export default function PermissionsAdmin() {
  const { role } = useAuth();
  const [roles, setRoles] = useState([]);
  const [mamas, setMamas] = useState([]);
  const [editRole, setEditRole] = useState(null);
  const [filterMama, setFilterMama] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "superadmin") {
      fetchMamas();
      fetchRoles();
    }
    // eslint-disable-next-line
  }, [role]);

  const fetchMamas = async () => {
    const { data } = await supabase.from("mamas").select("id, nom, ville");
    setMamas(data || []);
  };

  const fetchRoles = async () => {
    setLoading(true);
    let query = supabase.from("roles").select("*").order("nom", { ascending: true });
    if (filterMama) query = query.eq("mama_id", filterMama);
    const { data, error } = await query;
    if (!error) setRoles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (role === "superadmin") fetchRoles();
    // eslint-disable-next-line
  }, [filterMama]);

  const handlePermissionsSaved = () => {
    toast.success("Permissions mises à jour !");
    fetchRoles();
    setEditRole(null);
  };

  if (role !== "superadmin") {
    return (
      <div className="p-8">
        <h2 className="text-lg text-red-600 font-bold">Accès réservé aux superadmins</h2>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">Permissions globales (superadmin)</h1>
      <div className="flex items-end gap-4 mb-4">
        <label>
          <span className="text-gray-600">Filtrer par établissement :</span>
          <select
            className="input input-bordered ml-2"
            value={filterMama}
            onChange={e => setFilterMama(e.target.value)}
          >
            <option value="">Tous</option>
            {mamas.map(m => (
              <option key={m.id} value={m.id}>
                {m.nom} ({m.ville})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="bg-white shadow rounded-xl overflow-x-auto mb-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <span className="animate-spin mr-2">⏳</span>Chargement…
          </div>
        ) : (
          <table className="min-w-full table-auto text-center">
            <thead>
              <tr>
                <th className="px-2 py-1">Établissement</th>
                <th className="px-2 py-1">Rôle</th>
                <th className="px-2 py-1">Description</th>
                <th className="px-2 py-1">Actif</th>
                <th className="px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id}>
                  <td className="px-2 py-1">
                    {
                      mamas.find(m => m.id === role.mama_id)
                        ? `${mamas.find(m => m.id === role.mama_id)?.nom} (${mamas.find(m => m.id === role.mama_id)?.ville})`
                        : role.mama_id
                    }
                  </td>
                  <td className="px-2 py-1">{role.nom}</td>
                  <td className="px-2 py-1">{role.description || ""}</td>
                  <td className="px-2 py-1">
                    <span
                      className={
                        role.actif
                          ? "inline-block bg-green-100 text-green-800 px-2 rounded-full"
                          : "inline-block bg-red-100 text-red-800 px-2 rounded-full"
                      }
                    >
                      {role.actif ? "Oui" : "Non"}
                    </span>
                  </td>
                  <td className="px-2 py-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditRole(role)}
                      disabled={loading}
                    >
                      Modifier permissions
                    </Button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-gray-400">
                    Aucun rôle trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <Dialog open={!!editRole} onOpenChange={v => !v && setEditRole(null)}>
        <DialogContent className="bg-white rounded-xl shadow-lg p-6 max-w-xl">
          {editRole && (
            <PermissionsForm
              role={editRole}
              onClose={() => setEditRole(null)}
              onSaved={handlePermissionsSaved}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
