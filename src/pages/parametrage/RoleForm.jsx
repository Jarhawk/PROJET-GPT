// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React, { useState } from "react";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";

const MODULES = [
  "produits",
  "fiches",
  "factures",
  "utilisateurs",
  "roles",
  "commandes",
  "inventaire",
  "requisitions",
  "menu_du_jour",
  "menu_engineering",
];

export default function RoleForm({ role, onClose }) {
  const { addOrUpdateRole } = useRoles();
  const [nom, setNom] = useState(role.nom || "");
  const [accessRights, setAccessRights] = useState(role.access_rights || {});

  const toggle = (module, action) => {
    setAccessRights(prev => ({
      ...prev,
      [module]: {
        ...(prev[module] || {}),
        [action]: !prev?.[module]?.[action],
      },
    }));
  };

  const save = async () => {
    const payload = {
      ...role,
      nom,
      access_rights: accessRights,
    };
    await addOrUpdateRole(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl overflow-auto max-h-[90vh]">
        <h2 className="text-lg font-bold mb-4">{role.id ? "Modifier" : "Créer"} un rôle</h2>

        <label className="block mb-2">Nom du rôle</label>
        <input
          value={nom}
          onChange={e => setNom(e.target.value)}
          className="w-full border px-2 py-1 mb-4"
        />

        <table className="w-full text-sm border">
          <thead>
            <tr>
              <th className="border p-1">Module</th>
              <th className="border p-1">Lecture</th>
              <th className="border p-1">Création</th>
              <th className="border p-1">Édition</th>
              <th className="border p-1">Suppression</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map(mod => (
              <tr key={mod}>
                <td className="border p-1">{mod}</td>
                {["lecture", "creation", "edition", "suppression"].map(action => (
                  <td key={action} className="border p-1 text-center">
                    <input
                      type="checkbox"
                      checked={accessRights?.[mod]?.[action] || false}
                      onChange={() => toggle(mod, action)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} variant="ghost">
            Annuler
          </Button>
          <Button onClick={save}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}
