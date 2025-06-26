import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const MODULES = [
  { nom: "Factures", cle: "factures" },
  { nom: "Fiches techniques", cle: "fiches" },
  { nom: "Produits", cle: "produits" },
  { nom: "Fournisseurs", cle: "fournisseurs" },
  { nom: "Inventaire", cle: "inventaire" },
  { nom: "Requisitions", cle: "requisitions" },
  { nom: "Menus", cle: "menus" },
  { nom: "Reporting", cle: "reporting" },
  { nom: "Paramétrage", cle: "parametrage" },
];

const DROITS = [
  { nom: "Lecture", cle: "read" },
  { nom: "Création", cle: "create" },
  { nom: "Modification", cle: "update" },
  { nom: "Suppression", cle: "delete" },
];

export default function PermissionsForm({ role, onClose, onSaved }) {
  const { mama_id, role: myRole } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [role]);

  const fetchPermissions = async () => {
    try {
      let query = supabase
        .from("permissions")
        .select("*")
        .eq("role_id", role.id);
      if (myRole !== "superadmin") query = query.eq("mama_id", mama_id);
      const { data, error } = await query;
      if (error) throw error;
      setPermissions(data || []);
    } catch (err) {
      toast.error(err.message || "Erreur chargement permissions");
    }
  };

  const hasPermission = (module_cle, droit_cle) => {
    return permissions.some(
      p => p.module === module_cle && p.droit === droit_cle
    );
  };

  const togglePermission = async (module_cle, droit_cle) => {
    if (saving) return;
    try {
      setSaving(true);
      const exists = hasPermission(module_cle, droit_cle);
      let error = null;
      if (exists) {
        let query = supabase
          .from("permissions")
          .delete()
          .eq("role_id", role.id)
          .eq("module", module_cle)
          .eq("droit", droit_cle);
        if (myRole !== "superadmin") query = query.eq("mama_id", mama_id);
        const { error: err } = await query;
        error = err;
      } else {
        const { error: err } = await supabase.from("permissions").insert([
          {
            role_id: role.id,
            module: module_cle,
            droit: droit_cle,
            mama_id,
          },
        ]);
        error = err;
      }
      if (error) throw error;
      fetchPermissions();
      toast.success("Permission modifiée");
      onSaved?.();
    } catch (err) {
      toast.error(err.message || "Erreur lors de la modification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <Toaster />
      <h2 className="font-bold mb-4 text-lg">
        Permissions pour : <span className="text-mamastock-gold">{role.nom}</span>
      </h2>
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Module</th>
              {DROITS.map(droit => (
                <th key={droit.cle} className="px-2 py-1">{droit.nom}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map(module => (
              <tr key={module.cle}>
                <td className="px-2 py-1 text-left">{module.nom}</td>
                {DROITS.map(droit => (
                  <td key={droit.cle} className="px-2 py-1">
                    <input
                      type="checkbox"
                      checked={hasPermission(module.cle, droit.cle)}
                      disabled={saving}
                      onChange={() => togglePermission(module.cle, droit.cle)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {permissions.length === 0 && (
          <div className="text-gray-400 py-4">Aucune permission attribuée à ce rôle.</div>
        )}
      </div>
      <div className="flex gap-4 mt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Fermer
        </Button>
      </div>
    </div>
  );
}
