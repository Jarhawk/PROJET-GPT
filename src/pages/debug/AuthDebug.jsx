// src/pages/debug/AuthDebug.jsx
import useAuth from "@/hooks/useAuth";

export default function AuthDebug() {
  const { session, userData, role, mama_id, access_rights } = useAuth();

  return (
    <div className="p-4 text-sm text-white bg-black space-y-2">
      <h2 className="text-lg font-bold">Debug Auth</h2>
      <div>
        <strong>Session:</strong>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>
      <div>
        <strong>UserData:</strong>
        <pre>{JSON.stringify(userData, null, 2)}</pre>
      </div>
      <div>
        <strong>Role:</strong> {role || "-"}
      </div>
      <div>
        <strong>Mama ID:</strong> {mama_id || "-"}
      </div>
      <div>
        <strong>Access Rights:</strong>
        <pre>{JSON.stringify(access_rights, null, 2)}</pre>
      </div>
    </div>
  );
}
