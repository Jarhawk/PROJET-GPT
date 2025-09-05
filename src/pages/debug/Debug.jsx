// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";
import ApiDiagnostic from '@/components/dev/ApiDiagnostic.jsx';

export default function Debug() {
  const { session, role, mama_id, access_rights, loading: authLoading } = useAuth();
  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-8 flex flex-col items-center gap-4">
      <GlassCard className="max-w-3xl w-full">
        <h1 className="text-2xl font-bold mb-4 text-mamastock-gold">🧪 Debug AuthContext</h1>

        <div className="space-y-3">
          <div>
            <strong>Chargement :</strong> {authLoading ? "true" : "false"}
          </div>
          <div>
            <strong>Session ID :</strong> {session?.id || "Aucun"}
          </div>
          <div>
            <strong>Role :</strong> {role || "non défini"}
          </div>
          <div>
            <strong>Mama ID :</strong> {mama_id || "non défini"}
          </div>
          <div>
            <strong>Access Rights :</strong>
            <pre className="bg-white/10 text-sm border border-white/20 backdrop-blur-xl rounded p-3 mt-2">
              {JSON.stringify(access_rights, null, 2)}
            </pre>
          </div>
        </div>
      </GlassCard>
      {import.meta.env.DEV && <ApiDiagnostic mamaId={mama_id} />}
    </div>
  );
}
