// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function UtilisateurRow({
  utilisateur,
  onEdit,
  onToggleActive,
  onDelete,
  canEdit,
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  // Historique mock connexions
  const history = [
    { date: "2024-06-01 10:22", ip: "192.168.0.12" },
    { date: "2024-05-31 08:18", ip: "192.168.0.19" }
  ];

  const resetPassword = async () => {
    if (!utilisateur.email || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(utilisateur.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      toast.success("Lien de réinitialisation envoyé à " + utilisateur.email);
    } catch {
      toast.error("Erreur lors de l'envoi du lien");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <tr className={utilisateur.actif ? "" : "opacity-60"}>
        <td>{utilisateur.nom || utilisateur.email}</td>
        <td>
          <span className={
            utilisateur.role === "superadmin"
              ? "badge badge-superadmin"
              : utilisateur.role === "admin"
                ? "badge badge-admin"
                : "badge badge-user"
          }>
            {utilisateur.role}
          </span>
        </td>
        <td>{utilisateur.mama_id}</td>
        <td>
          {canEdit && (
            <>
              <button className="btn btn-sm mr-2" onClick={() => onEdit(utilisateur)}>Éditer</button>
              <button
                className="btn btn-sm mr-2"
                onClick={() => onToggleActive(utilisateur.id, !utilisateur.actif)}
              >
                {utilisateur.actif ? "Désactiver" : "Activer"}
              </button>
              <button className="btn btn-sm mr-2" onClick={resetPassword} disabled={loading}>
                Reset MDP
              </button>
              {onDelete && (
                <button
                  className="btn btn-sm mr-2"
                  onClick={() => onDelete(utilisateur)}
                >
                  Supprimer
                </button>
              )}
            </>
          )}
          <button className="btn btn-sm" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? "Masquer historique" : "Connexions"}
          </button>
        </td>
      </tr>
      {showHistory && (
        <tr>
          <td colSpan={4} className="bg-glass border border-borderGlass backdrop-blur">
            <div>
              <b>Connexions récentes :</b>
              <ul>
                {history.map((h, i) => (
                  <li key={i}>{h.date} — IP {h.ip}</li>
                ))}
              </ul>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
