// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/pages/debug/AuthDebug.jsx
import useAuth from "@/hooks/useAuth";
import GlassCard from "@/components/ui/GlassCard";
import ResetAuthButton from "@/components/ResetAuthButton";

export default function AuthDebug() {
  const { user_id, role, mama_id, access_rights } = useAuth();

  return (
    <div className="p-6 flex justify-center">
      <GlassCard className="w-full max-w-xl overflow-auto text-xs">
        <pre>{JSON.stringify({ user_id, role, mama_id, access_rights }, null, 2)}</pre>
        <div className="mt-2">
          <ResetAuthButton className="underline text-sm" />
        </div>
      </GlassCard>
    </div>
  );
}
