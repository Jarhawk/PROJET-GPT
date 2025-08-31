// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { usePermissions } from '@/hooks/usePermissions';
import { useRoles } from '@/hooks/useRoles';
import { Button } from '@/components/ui/button';
import TableContainer from '@/components/ui/TableContainer';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MODULES as MODULE_LIST } from '@/config/modules';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

export default function ParamAccess() {
  const { permissions, fetchPermissions, updatePermission } = usePermissions();
  const { roles, fetchRoles } = useRoles();
  const { mama_id, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (mama_id || role === 'superadmin') {
      fetchPermissions();
      fetchRoles();
    }
  }, [mama_id, role]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  // Liste des modules disponibles
  const modules = [];
  if (Array.isArray(MODULE_LIST)) {
    for (const m of MODULE_LIST) modules.push(m.key);
  }

  // Modification rapide
  const handleChange = async (role_id, module) => {
    const perms = Array.isArray(permissions) ? permissions : [];
    let current = null;
    for (const p of perms) {
      if (p.role_id === role_id && p.module === module) {
        current = p;
        break;
      }
    }
    if (!current) return;
    await updatePermission(current.id, { actif: !current.actif });
    await fetchPermissions();
    toast.success('Droits modifiés !');
  };

  return (
    <div>
            <h2 className="font-bold text-xl mb-4">Grille d'accès par rôle</h2>
      <TableContainer className="mt-2">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th>Rôle</th>
              {(() => {
                const heads = [];
                for (const m of modules) heads.push(<th key={m}>{m}</th>);
                return heads;
              })()}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const rows = [];
              const list = Array.isArray(roles) ? roles : [];
              for (const r of list) {
                const cells = [];
                for (const m of modules) {
                  const perms = Array.isArray(permissions) ? permissions : [];
                  let current = null;
                  for (const p of perms) {
                    if (p.role_id === r.id && p.module === m) {
                      current = p;
                      break;
                    }
                  }
                  cells.push(
                    <td key={m}>
                      <input
                        type="checkbox"
                        checked={!!current?.actif}
                        onChange={() => handleChange(r.id, m)}
                      />
                    </td>
                  );
                }
                rows.push(
                  <tr key={r.id}>
                    <td>{r.nom}</td>
                    {cells}
                  </tr>
                );
              }
              return rows;
            })()}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
