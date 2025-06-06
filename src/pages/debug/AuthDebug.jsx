// src/pages/debug/AuthDebug.jsx
import { useAuth } from "@/context/AuthContext";

export default function AuthDebug() {
  const { session, role, mama_id, access_rights } = useAuth();

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-3xl text-mamastock-gold font-bold mb-4">🔍 Debug Auth</h1>
      <pre className="bg-white text-black p-4 rounded shadow overflow-auto">
        {JSON.stringify(
          {
            user_id: session?.user?.id,
            email: session?.user?.email,
            role,
            mama_id,
            access_rights,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}
