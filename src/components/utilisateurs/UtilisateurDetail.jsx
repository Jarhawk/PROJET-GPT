// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Button } from "@/components/ui/button";

export default function UtilisateurDetail({ utilisateur, onClose }) {
  const historique = utilisateur.historique || [
    { date: "2024-06-10", action: "Création", by: "superadmin" },
    // Ajoute plus d’actions selon ta base
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="font-bold text-xl mb-4">{utilisateur.nom || utilisateur.email}</h2>
        <div><b>Rôle :</b> {utilisateur.role}</div>
        <div><b>Actif :</b> {utilisateur.actif ? "Oui" : "Non"}</div>
        {utilisateur.access_rights && (
          <div>
            <b>Droits :</b>
            <pre className="text-xs whitespace-pre-wrap max-h-40 overflow-auto bg-black/20 p-2 rounded">
              {JSON.stringify(utilisateur.access_rights, null, 2)}
            </pre>
          </div>
        )}
        <div>
          <b>Historique :</b>
          <ul className="list-disc pl-6">
            {historique.map((h, i) =>
              <li key={i}>{h.date} — {h.action} {h.by ? `par ${h.by}` : ""}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
