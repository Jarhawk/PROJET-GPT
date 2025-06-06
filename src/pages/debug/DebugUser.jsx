// src/pages/debug/DebugUser.jsx
import { useAuth } from "@/context/AuthContext";

export default function DebugUser() {
  const { session, role, mama_id, access_rights, authReady } = useAuth();

  if (!authReady) return <p>Chargement...</p>;

  return (
    <div className="p-6 text-white bg-black">
      <h2 className="text-lg font-bold">🧪 DEBUG UTILISATEUR</h2>
      <pre>{JSON.stringify({ session, role, mama_id, access_rights }, null, 2)}</pre>
    </div>
  );
}
