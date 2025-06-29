import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

export default function Dashboard() {
  const { session, userData, loading } = useAuth();
  const user = session?.user;

  if (loading || !user || !userData) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <div className="p-6 flex justify-center">
      <GlassCard className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Bienvenue sur MamaStock</h1>
        <p>Connecté avec : {user.email}</p>
      </GlassCard>
    </div>
  );
}
