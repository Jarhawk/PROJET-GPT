// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";

export function useRGPD() {
  const { user_id, mama_id, role } = useAuth();

  async function logAccess(userId, action, table) {
    if (!userId) return;
    await supabase.from("journal_audit").insert([
      { user_id: userId, mama_id, action, table_name: table },
    ]);
  }

  async function getUserDataExport(userId = user_id) {
    if (!userId) return null;
    const { data: profil } = await supabase
      .from("utilisateurs")
      .select("id,created_at")
      .eq("auth_id", userId)
      .single();
    const { data: logs } = await supabase
      .from("journal_audit")
      .select("action, table_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { profil, logs };
  }

  async function purgeUserData(userId) {
    if (role !== "superadmin") return { error: "not allowed" };
    return await supabase.from("utilisateurs").delete().eq("auth_id", userId);
  }

  return { logAccess, getUserDataExport, purgeUserData };
}
