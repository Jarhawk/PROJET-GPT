// src/pages/debug/AuthDebug.jsx
import useAuth from "@/hooks/useAuth";

export default function AuthDebug() {
  const { session, userData } = useAuth();

  return (
    <pre className="p-4 text-sm text-white bg-black">
      {JSON.stringify({ session, userData }, null, 2)}
    </pre>
  );
}
