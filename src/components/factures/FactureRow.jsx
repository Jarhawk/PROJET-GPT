import { Button } from "@/components/ui/button";

const STATUTS = {
  brouillon: "badge",
  "en attente": "badge badge-user",
  validée: "badge badge-admin",
  payée: "badge badge-admin",
  refusée: "badge badge-superadmin",
  annulée: "badge badge-superadmin",
  archivée: "badge",
};

export default function FactureRow({ facture, onEdit, onDetail, onToggleActive, onArchive, canEdit }) {
  return (
    <tr>
      <td className="border px-4 py-2">{facture.numero || facture.id}</td>
      <td className="border px-4 py-2">{facture.date_facture}</td>
      <td className="border px-4 py-2">{facture.fournisseur?.nom}</td>
      <td className="border px-4 py-2 text-right">{facture.total_ttc?.toFixed(2)} €</td>
      <td className="border px-4 py-2">
        <span className={STATUTS[facture.statut] || "badge"}>{facture.statut}</span>
      </td>
      <td className="border px-4 py-2">{facture.actif ? "✅" : "❌"}</td>
      <td className="border px-4 py-2 space-x-1">
        {canEdit && (
          <>
            <Button size="sm" variant="outline" className="mr-2" onClick={() => onEdit(facture)}>
              Modifier
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="mr-2"
              onClick={() => onToggleActive(facture.id, !facture.actif)}
            >
              {facture.actif ? "Désactiver" : "Réactiver"}
            </Button>
            <Button size="sm" variant="destructive" className="mr-2" onClick={() => onArchive(facture)}>
              Archiver
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" onClick={() => onDetail(facture)}>
          Détail
        </Button>
      </td>
    </tr>
  );
}
