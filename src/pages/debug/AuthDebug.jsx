// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/pages/debug/AuthDebug.jsx
import useAuth from "@/hooks/useAuth";
import GlassCard from "@/components/ui/GlassCard";
import ResetAuthButton from "@/components/ResetAuthButton";

function StatusDot({ ok }) {
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
    />
  );
}

export default function AuthDebug() {
  const auth = useAuth();
  const { session, userData } = auth;

  return (
    <div className="p-6 flex justify-center">
      <GlassCard className="w-full max-w-xl overflow-auto text-xs p-4">
        <div className="flex items-center gap-2 mb-2">
          <StatusDot ok={!!session} /> <span>session</span>
          <StatusDot ok={!!userData} className="ml-4" /> <span>userData</span>
        </div>
        <pre>{JSON.stringify(auth, null, 2)}</pre>
        <div className="mt-2">
          <ResetAuthButton className="underline text-sm" />
        </div>
      </GlassCard>
    </div>
  );
}
