// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function RequisitionRow({ requisition }) {
  return (
    <tr>
      <td className="p-2 text-center">
        {new Date(requisition.date_requisition).toLocaleDateString('fr-FR')}
      </td>
      <td className="p-2 text-center">{requisition.produit_nom}</td>
      <td className="p-2 text-right">{requisition.quantite}</td>
    </tr>
  );
}
