// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import ModalGlass from "@/components/ui/ModalGlass";
import Button from "@/components/ui/Button";
import TableContainer from "@/components/ui/TableContainer";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function SimulationDetailsModal({ open, onClose, result }) {
  const exportExcel = () => {
    if (!result) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(result.produits || []),
      "Besoins"
    );
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "besoins_previsionnels.xlsx");
  };

  return (
    <ModalGlass open={open} onClose={onClose}>
      <h2 className="text-lg font-bold mb-2">Détails des besoins</h2>
      <TableContainer className="mb-4">
        <table className="min-w-full text-sm text-white">
          <thead>
            <tr>
              <th className="px-2">Produit</th>
              <th className="px-2">Quantité</th>
              <th className="px-2">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {(result?.produits || []).map((p, idx) => (
              <tr key={idx}>
                <td className="px-2">{p.produit_nom || p.produit_id}</td>
                <td className="px-2">{p.quantite}</td>
                <td className="px-2">{p.valeur}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
      <div className="flex justify-end gap-2">
        <Button onClick={exportExcel}>Export Excel</Button>
        <Button onClick={onClose}>Fermer</Button>
      </div>
    </ModalGlass>
  );
}
