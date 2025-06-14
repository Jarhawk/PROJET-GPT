import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@radix-ui/react-dialog";
import PermissionsForm from "./PermissionsForm";
import toast, { Toaster } from "react-hot-toast";

export default function Permissions() {
  const { mama_id } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRole, setEditRole] = useState(null);

  useEffect(() => {
    if (mama_id) fetchRoles();
  }, [mama_id]);

  const fetchRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .eq("mama_id", mama_id)
      .order("nom", { ascending: true });
    if (!error) setRoles(data || []);
    setLoading(false);
  };

  const handlePermissionsSaved = () => {
    toast.success("Permissions mises à jour !");
    fetchRoles();
    setEditRole(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">Permissions des rôles</h1>
      <div className="bg-white shadow rounded-xl overflow-x-auto mb-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <span className="animate-spin mr-2">⏳</span>Chargement…
          </div>
        ) : (
          <table className="min-w-full table-auto text-center">
            <thead>
              <tr>
                <th className="px-2 py-1">Rôle</th>
                <th className="px-2 py-1">Description</th>
                <th className="px-2 py-1">Actif</th>
                <th className="px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id}>
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
                  <td colSpan={4} className="py-4 text-gray-400">
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
