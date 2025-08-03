// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { motion as Motion } from "framer-motion";
import FactureRow from "@/components/factures/FactureRow.jsx";
import ListingContainer from "@/components/ui/ListingContainer";

export default function FactureTable({
  factures = [],
  canEdit = false,
  onEdit,
  onDetail,
  onToggleActive,
  onArchive,
}) {
  return (
    <ListingContainer className="mb-4">
      <Motion.table
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-full text-sm"
      >
        <thead>
          <tr>
            <th className="px-4 py-2">Numéro</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Fournisseur</th>
            <th className="px-4 py-2 text-right">Montant TTC</th>
            <th className="px-4 py-2">Statut</th>
            <th className="px-4 py-2">Actif</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {factures.map(facture => (
            <FactureRow
              key={facture.id}
              facture={facture}
              canEdit={canEdit}
              onEdit={onEdit}
              onDetail={onDetail}
              onToggleActive={onToggleActive}
              onArchive={onArchive}
            />
          ))}
        </tbody>
      </Motion.table>
    </ListingContainer>
  );
}
