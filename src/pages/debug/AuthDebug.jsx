// src/pages/debug/AuthDebug.jsx
import useAuth from "@/hooks/useAuth";

export default function AuthDebug() {
  const { user_id, role, mama_id, access_rights, session } = useAuth();

  return (
    <div>
      <h2>Debug Auth</h2>
      <pre>{JSON.stringify({ user_id, role, mama_id, access_rights, claims: session?.user }, null, 2)}</pre>
    </div>
  );
}
