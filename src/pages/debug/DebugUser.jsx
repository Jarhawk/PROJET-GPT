// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/pages/debug/DebugUser.jsx
import useAuth from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

export default function DebugUser() {
  const { session, role, mama_id, access_rights, loading: authLoading } = useAuth();

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 flex justify-center">
      <GlassCard className="w-full max-w-xl overflow-auto text-xs text-white">
        <h2 className="text-lg font-bold mb-2">🧪 DEBUG UTILISATEUR</h2>
        <pre>{JSON.stringify({ session, role, mama_id, access_rights }, null, 2)}</pre>
      </GlassCard>
    </div>
  );
}
