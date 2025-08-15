// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export function useRGPD() {
  const { user_id, role } = useAuth();

  async function getUserDataExport(userId = user_id) {
    if (!userId) return null;
    const { data: profil } = await supabase
      .from("utilisateurs")
      .select("id,created_at")
      .eq("auth_id", userId)
      .single();
    return { profil, logs: [] };
  }

  async function purgeUserData(userId) {
    if (role !== "superadmin") return { error: "not allowed" };
    return await supabase.from("utilisateurs").delete().eq("auth_id", userId);
  }

  return { getUserDataExport, purgeUserData };
}
