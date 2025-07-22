// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/useAuth";
import toast, { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Suppose que tu as un hook ou un cache des MAMA/roles
// Sinon tu peux les fetch en plus simple comme plus haut
export default function InvitationsEnAttente() {
  const { mama_id } = useAuth();
  const [invites, setInvites] = useState([]);
  const [mamas, setMamas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (!mama_id) return;
    supabase
      .from("mamas")
      .select("id, nom")
      .eq("id", mama_id)
      .then(({ data }) => setMamas(data || []));
    supabase
      .from("roles")
      .select("*")
      .eq("mama_id", mama_id)
      .then(({ data }) => setRoles(data || []));
    setLoading(true);
    supabase
      .from("utilisateurs")
      .select("id, nom, mama_id, role, invite_pending, actif, created_at")
      .eq("invite_pending", true)
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setInvites(data || []);
        setLoading(false);
      });
  }, [mama_id]);

  const mamaNom = id => mamas.find(m => m.id === id)?.nom || id;
  const roleNom = nom => roles.find(r => r.nom === nom)?.nom || nom;

  const handleResend = async () => {
    toast.error("Impossible de renvoyer l'invitation sans email");
  };

  const handleCancel = async (userId) => {
    await supabase
      .from("utilisateurs")
      .delete()
      .eq("id", userId)
      .eq("mama_id", mama_id);
    setInvites(invites => invites.filter(u => u.id !== userId));
    setConfirmDeleteId(null);
    toast.success("Invitation annulée !");
  };

  if (loading) return <LoadingSpinner message="Chargement…" />;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">
        Invitations en attente
      </h1>
      <div className="bg-glass border border-borderGlass backdrop-blur shadow rounded-xl overflow-x-auto">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th>Email</th>
              <th>Établissement</th>
              <th>Rôle</th>
              <th>Envoyée le</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invites.map(u => (
              <tr key={u.id}>
                <td>{u.nom}</td>
                <td>{mamaNom(u.mama_id)}</td>
                <td>{roleNom(u.role)}</td>
                <td>{u.created_at?.slice(0, 16).replace("T", " ")}</td>
                <td>En attente</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResend(u)}
                  >
                    Relancer
                  </Button>
                  {confirmDeleteId === u.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="ml-2"
                        onClick={() => handleCancel(u.id)}
                      >
                        Confirmer
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="ml-2"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="ml-2"
                      onClick={() => setConfirmDeleteId(u.id)}
                    >
                      Annuler
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {invites.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-gray-500">
                  Aucune invitation en attente
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
