// src/pages/debug/AuthDebug.jsx
import { useAuth } from "@/context/AuthContext";

export default function AuthDebug() {
  const { user_id, role, mama_id, access_rights } = useAuth();

  return (
    <div>
      <h2>Debug Auth</h2>
      <pre>{JSON.stringify({ user_id, role, mama_id, access_rights }, null, 2)}</pre>
    </div>
  );
}
