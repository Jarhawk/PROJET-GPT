// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect } from "react";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { useAuth } from "@/context/AuthContext";
import { MODULES } from "@/config/modules";
import { toast, Toaster } from "react-hot-toast";
import TableContainer from "@/components/ui/TableContainer";

export default function AccessRights() {
  const { users, fetchUsers, updateUser } = useUtilisateurs();
  const { mama_id } = useAuth();

  useEffect(() => {
    if (mama_id) fetchUsers();
  }, [mama_id, fetchUsers]);

  const toggle = async (user, moduleKey) => {
    const current = Array.isArray(user.access_rights) ? user.access_rights : [];
    const updated = current.includes(moduleKey)
      ? current.filter(k => k !== moduleKey)
      : [...current, moduleKey];
    await updateUser(user.id, { access_rights: updated });
    toast.success("Droits mis à jour");
  };

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">
        Droits personnalisés par utilisateur
      </h1>
      <TableContainer>
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Utilisateur</th>
              {MODULES.map(m => (
                <th key={m.key} className="px-2 py-1">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-2 py-1 text-left">{u.nom || u.email}</td>
                {MODULES.map(m => {
                  const current = Array.isArray(u.access_rights)
                    ? u.access_rights
                    : [];
                  return (
                    <td key={m.key} className="px-2 py-1">
                      <input
                        type="checkbox"
                        checked={current.includes(m.key)}
                        onChange={() => toggle(u, m.key)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={MODULES.length + 1} className="py-4 text-gray-400">
                  Aucun utilisateur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
