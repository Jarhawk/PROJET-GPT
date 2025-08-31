// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import RoleForm from "./RoleForm";

export default function Roles() {
  const { roles, loading, toggleActif } = useRoles();
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Gestion des rôles</h1>

      <Button onClick={() => setSelectedRole({})}>➕ Nouveau rôle</Button>

      {loading && <p>Chargement...</p>}

      <div className="mt-4 space-y-2">
        {(() => {
          const items = [];
          for (const r of roles) {
            items.push(
              <div
                key={r.id}
                className="border p-2 rounded-md flex flex-col sm:flex-row justify-between items-center"
              >
                <div>
                  <strong>{r.nom}</strong>
                  {!r.actif && (
                    <span className="ml-2 text-red-500">[Inactif]</span>
                  )}
                </div>
                <div className="space-x-2 mt-2 sm:mt-0">
                  <Button onClick={() => setSelectedRole(r)}>✏️ Modifier</Button>
                  <Button
                    variant="destructive"
                    onClick={() => toggleActif(r.id, !r.actif)}
                  >
                    {r.actif ? "Désactiver" : "Réactiver"}
                  </Button>
                </div>
              </div>
            );
          }
          return items;
        })()}
      </div>

      {selectedRole && (
        <RoleForm role={selectedRole} onClose={() => setSelectedRole(null)} />
      )}
    </div>
  );
}
