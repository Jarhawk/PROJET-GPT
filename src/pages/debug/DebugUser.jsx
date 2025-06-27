// src/pages/debug/DebugUser.jsx
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function DebugUser() {
  const { session, role, mama_id, access_rights, loading: authLoading } = useAuth();

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 text-white bg-black">
      <h2 className="text-lg font-bold">🧪 DEBUG UTILISATEUR</h2>
      <pre>{JSON.stringify({ session, role, mama_id, access_rights }, null, 2)}</pre>
    </div>
  );
}
