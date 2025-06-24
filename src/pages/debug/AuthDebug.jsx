// src/pages/debug/AuthDebug.jsx
import useAuth from "@/hooks/useAuth";

export default function AuthDebug() {
  const { user_id, role, mama_id, access_rights, session } = useAuth();

  return (
    <div className="p-4 text-sm text-white bg-black space-y-2">
      <h2 className="text-lg font-bold">Debug Auth</h2>
      <pre>{JSON.stringify({
        user_id,
        email: session?.user?.email,
        role,
        mama_id,
        access_rights,
        claims: session?.user,
      }, null, 2)}</pre>
    </div>
  );
}
