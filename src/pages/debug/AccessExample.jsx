import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";

export default function AccessExample() {
  const { loading, hasAccess } = useAuth();
  if (loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 flex justify-center">
      <GlassCard className="w-full max-w-xl text-white text-sm">
        <h2 className="text-lg font-bold mb-2">Exemple de droits</h2>
        <p className="mb-2">Accès au module 'factures' : {hasAccess('factures') ? 'oui' : 'non'}</p>
        <p>Accès au module 'utilisateurs' : {hasAccess('utilisateurs') ? 'oui' : 'non'}</p>
      </GlassCard>
    </div>
  );
}
