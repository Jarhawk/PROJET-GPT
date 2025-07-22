// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useAuditLog() {
  const { mama_id, user } = useAuth();

  async function log(action, details = null) {
    if (!mama_id) return;
    await supabase.from("journaux_utilisateur").insert([
      {
        mama_id,
        user_id: user?.id || null,
        action,
        details,
        done_by: user?.id || null,
      },
    ]);
  }

  async function logAction({ module, action, cible_id = null, details = null }) {
    if (!mama_id) return;
    await supabase.from("journal_audit").insert([
      {
        mama_id,
        table_name: module,
        operation: action,
        row_id: cible_id,
        new_data: details,
        changed_by: user?.id || null,
      },
    ]);
  }

  async function logSecurityEvent({ type, user_id = null, description = "" }) {
    if (!mama_id) return;
    const ip = window?.location?.hostname || null;
    const navigateur = navigator.userAgent;
    await supabase.from("logs_securite").insert([
      {
        mama_id,
        type,
        user_id: user_id || user?.id || null,
        ip,
        navigateur,
        description,
      },
    ]);
  }

  return { log, logAction, logSecurityEvent };
}
