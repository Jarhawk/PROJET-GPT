import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useAuditLog() {
  const { mama_id, user } = useAuth();

  async function log(action, details = null) {
    if (!mama_id) return;
    await supabase.from("user_logs").insert([
      {
        mama_id,
        user_id: user?.id || null,
        action,
        details,
        done_by: user?.id || null,
      },
    ]);
  }

  return { log };
}
