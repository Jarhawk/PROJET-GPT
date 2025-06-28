// src/pages/debug/AuthDebug.jsx
import useAuth from "@/hooks/useAuth";
import GlassCard from "@/components/ui/GlassCard";

export default function AuthDebug() {
  const { session, userData } = useAuth();

  return (
    <div className="p-6 flex justify-center">
      <GlassCard className="w-full max-w-xl overflow-auto text-xs">
        <pre>{JSON.stringify({ session, userData }, null, 2)}</pre>
      </GlassCard>
    </div>
  );
}
