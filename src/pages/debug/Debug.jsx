import React from "react";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Debug() {
  const { session, role, mama_id, access_rights, loading: authLoading } = useAuth();
  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-mamastock-gold">🧪 Debug AuthContext</h1>

        <div className="space-y-3">
          <div>
            <strong>Chargement :</strong> {authLoading ? "true" : "false"}
          </div>
          <div>
            <strong>Session ID :</strong> {session?.id || "Aucun"}
          </div>
          <div>
            <strong>Role :</strong> {role || "non défini"}
          </div>
          <div>
            <strong>Mama ID :</strong> {mama_id || "non défini"}
          </div>
          <div>
            <strong>Access Rights :</strong>
            <pre className="bg-gray-100 text-sm border rounded p-3 mt-2">
              {JSON.stringify(access_rights, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
