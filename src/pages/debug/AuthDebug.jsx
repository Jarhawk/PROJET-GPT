// src/pages/debug/AuthDebug.jsx
import useAuth from "@/hooks/useAuth";

export default function AuthDebug() {
  const { user_id, role, mama_id, access_rights, session } = useAuth();
  const email = session?.user?.email;

  return (
    <div>
      <h2>Debug Auth</h2>
      <pre>{JSON.stringify({ email, user_id, role, mama_id, access_rights, sessionActive: !!session }, null, 2)}</pre>
    </div>
  );
}
