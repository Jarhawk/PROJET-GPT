// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { usePermissions } from "@/hooks/usePermissions";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { MODULES as MODULE_LIST } from "@/config/modules";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toaster, toast } from "react-hot-toast";

export default function ParamAccess() {
  const { permissions, fetchPermissions, updatePermission } = usePermissions();
  const { roles, fetchRoles } = useRoles();
  const { mama_id, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (mama_id || role === "superadmin") {
      fetchPermissions();
      fetchRoles();
    }
  }, [mama_id, role]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  // Liste des modules disponibles
  const modules = MODULE_LIST.map((m) => m.key);

  // Modification rapide
  const handleChange = async (role_id, module) => {
    const current = permissions.find(p => p.role_id === role_id && p.module === module);
    if (!current) return;
    await updatePermission(current.id, { actif: !current.actif });
    await fetchPermissions();
    toast.success("Droits modifiés !");
  };

  return (
    <div>
      <Toaster position="top-right" />
      <h2 className="font-bold text-xl mb-4">Grille d’accès par rôle</h2>
      <TableContainer className="mt-2">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th>Rôle</th>
              {modules.map(m => <th key={m}>{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id}>
              <td>{r.nom}</td>
              {modules.map(m => {
                const current = permissions.find(p => p.role_id === r.id && p.module === m);
                return (
                  <td key={m}>
                    <input
                      type="checkbox"
                      checked={!!current?.actif}
                      onChange={() => handleChange(r.id, m)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
