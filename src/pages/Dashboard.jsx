import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Bienvenue sur MamaStock</h1>
      <p>Connecté avec : {user.email}</p>
    </div>
  );
}
