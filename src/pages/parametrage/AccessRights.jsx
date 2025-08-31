// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect } from "react";
import { useUtilisateurs } from "@/hooks/useUtilisateurs";
import { useAuth } from '@/hooks/useAuth';
import { MODULES } from "@/config/modules";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { toast } from 'sonner';
import TableContainer from "@/components/ui/TableContainer";

export default function AccessRights() {
  const { users, fetchUsers, updateUser } = useUtilisateurs();
  const { mama_id, loading: authLoading } = useAuth();

  useEffect(() => {
    if (mama_id) fetchUsers();
  }, [mama_id, fetchUsers]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

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
            <h1 className="text-2xl font-bold text-mamastock-gold mb-4">
        Droits personnalisés par utilisateur
      </h1>
      <TableContainer>
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th rowSpan="2" className="px-2 py-1 text-left">Utilisateur</th>
              {(() => {
                const headers = [];
                const mods = Array.isArray(MODULES) ? MODULES : [];
                for (let i = 0; i < mods.length; i++) {
                  const m = mods[i];
                  headers.push(
                    <th key={m.key} colSpan={2} className="px-2 py-1">
                      {m.label}
                    </th>
                  );
                }
                return headers;
              })()}
            </tr>
            <tr>
              {(() => {
                const headers = [];
                const mods = Array.isArray(MODULES) ? MODULES : [];
                for (let i = 0; i < mods.length; i++) {
                  const m = mods[i];
                  headers.push(
                    <th key={`${m.key}-v`} className="px-2 py-1">Voir</th>,
                    <th key={`${m.key}-e`} className="px-2 py-1">Modifier</th>
                  );
                }
                return headers;
              })()}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const body = [];
              const list = Array.isArray(users) ? users : [];
              const mods = Array.isArray(MODULES) ? MODULES : [];
              for (let i = 0; i < list.length; i++) {
                const u = list[i];
                const cells = [];
                for (let j = 0; j < mods.length; j++) {
                  const m = mods[j];
                  const current =
                    u.access_rights && typeof u.access_rights === 'object'
                      ? u.access_rights
                      : {};
                  cells.push(
                    <td key={`${u.id}-${m.key}-v`} className="px-2 py-1">
                      <input
                        type="checkbox"
                        checked={current[m.key]?.peut_voir || false}
                        onChange={() => toggle(u, m.key, 'peut_voir')}
                      />
                    </td>
                  );
                  cells.push(
                    <td key={`${u.id}-${m.key}-e`} className="px-2 py-1">
                      <input
                        type="checkbox"
                        checked={current[m.key]?.peut_modifier || false}
                        onChange={() => toggle(u, m.key, 'peut_modifier')}
                      />
                    </td>
                  );
                }
                body.push(
                  <tr key={u.id}>
                    <td className="px-2 py-1 text-left">{u.nom || u.email}</td>
                    {cells}
                  </tr>
                );
              }
              if (body.length === 0) {
                body.push(
                  <tr key="empty">
                    <td colSpan={mods.length * 2 + 1} className="py-4 text-gray-400">
                      Aucun utilisateur.
                    </td>
                  </tr>
                );
              }
              return body;
            })()}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
