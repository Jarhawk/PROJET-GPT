import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  console.log("DEBUG user", user);

  if (!user) return <div>Chargement...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Bienvenue sur MamaStock</h1>
      <p>Connecté avec : {user.email}</p>
    </div>
  );
}
// ✅ Étape validée
