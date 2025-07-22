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

  const toggle = async (user, moduleKey, field) => {
    const current = user.access_rights && typeof user.access_rights === 'object'
      ? user.access_rights
      : {};
    const mod = { ...(current[moduleKey] || {}) };
    mod[field] = !mod[field];
    const updated = { ...current, [moduleKey]: mod };
    await updateUser(user.id, { access_rights: updated });
    toast.success('Droits mis à jour');
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
              <th rowSpan="2" className="px-2 py-1 text-left">Utilisateur</th>
              {MODULES.map(m => (
                <th key={m.key} colSpan={2} className="px-2 py-1">
                  {m.label}
                </th>
              ))}
            </tr>
            <tr>
              {MODULES.map(m => (
                <>
                  <th key={`${m.key}-v`} className="px-2 py-1">Voir</th>
                  <th key={`${m.key}-e`} className="px-2 py-1">Modifier</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-2 py-1 text-left">{u.nom || u.email}</td>
                {MODULES.map(m => {
                  const current =
                    u.access_rights && typeof u.access_rights === 'object'
                      ? u.access_rights
                      : {};
                  return (
                    <>
                      <td key={`${m.key}-v`} className="px-2 py-1">
                        <input
                          type="checkbox"
                          checked={current[m.key]?.peut_voir || false}
                          onChange={() => toggle(u, m.key, 'peut_voir')}
                        />
                      </td>
                      <td key={`${m.key}-e`} className="px-2 py-1">
                        <input
                          type="checkbox"
                          checked={current[m.key]?.peut_modifier || false}
                          onChange={() => toggle(u, m.key, 'peut_modifier')}
                        />
                      </td>
                    </>
                  );
                })}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={MODULES.length * 2 + 1} className="py-4 text-gray-400">
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
