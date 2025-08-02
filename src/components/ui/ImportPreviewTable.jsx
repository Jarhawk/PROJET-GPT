import { Button } from "@/components/ui/button";

export default function ImportPreviewTable({ rows, onImport, importing }) {
  const allValid = rows.every((r) => r.errors.length === 0);
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Famille</th>
              <th>Sous-famille</th>
              <th>Unité</th>
              <th>Zone stock</th>
              <th>Code</th>
              <th>Allergènes</th>
              <th>Actif</th>
              <th>PMP</th>
              <th>Stock théorique</th>
              <th>Stock min</th>
              <th>Dernier prix</th>
              <th>Fournisseur ID</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={row.errors.length ? "bg-red-50" : "bg-green-50"}>
                <td>{row.nom}</td>
                <td>{row.famille_nom}</td>
                <td>{row.sous_famille_nom}</td>
                <td>{row.unite_nom}</td>
                <td>{row.zone_stock_nom}</td>
                <td>{row.code}</td>
                <td>{row.allergenes}</td>
                <td>{row.actif ? "Oui" : "Non"}</td>
                <td className="text-right">{row.pmp ?? ""}</td>
                <td className="text-right">{row.stock_theorique ?? ""}</td>
                <td className="text-right">{row.stock_min ?? ""}</td>
                <td className="text-right">{row.dernier_prix ?? ""}</td>
                <td>{row.fournisseur_id ?? ""}</td>
                <td>
                  {row.errors.length
                    ? `❌ ${row.errors.join(", ")}`
                    : row.insertError
                    ? `❌ ${row.insertError}`
                    : "✅ OK"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {allValid && (
        <div className="text-right">
          <Button onClick={onImport} disabled={importing || rows.length === 0}>
            Importer maintenant
          </Button>
        </div>
      )}
    </div>
  );
}

