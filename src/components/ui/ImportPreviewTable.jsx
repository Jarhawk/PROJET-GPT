import { validateProduitRow } from "@/utils/excelUtils";

export default function ImportPreviewTable({ rows, onUpdate, maps, reference }) {
  const { familles = [], sousFamilles = [], unites = [], zones = [] } =
    reference || {};

  function handleChange(index, field, value) {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    if (maps) {
      updated[index] = validateProduitRow(updated[index], maps);
    }
    onUpdate(updated);
  }

  const renderCell = (row, idx, field, listId) => (
    <td
      className={`${row.errors[field] ? "bg-red-50 text-red-600" : "text-black"}`}
      title={row.errors[field] || ""}
    >
      <input
        value={row[field] ?? ""}
        list={listId}
        onChange={(e) => handleChange(idx, field, e.target.value)}
        className={`w-full px-2 py-1 border rounded text-xs bg-white text-black ${
          row.errors[field] ? "border-red-500" : "border-gray-300"
        }`}
      />
    </td>
  );

  return (
    <>
      <table className="min-w-full table-auto text-xs text-black">
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            <th>Nom</th>
            <th>Famille</th>
            <th>Sous-famille</th>
            <th>Unité</th>
            <th>Zone stock</th>
            <th>Stock min</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              className={
                row.status === "error" ? "bg-red-50 text-black" : "bg-green-50 text-black"
              }
            >
              {renderCell(row, idx, "nom")}
              {renderCell(row, idx, "famille_nom", "familles-list")}
              {renderCell(row, idx, "sous_famille_nom", "sousfamilles-list")}
              {renderCell(row, idx, "unite_nom", "unites-list")}
              {renderCell(row, idx, "zone_stock_nom", "zones-list")}
              {renderCell(row, idx, "stock_min")}
              <td className="text-center">{row.status === "ok" ? "✅" : "❌"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <datalist id="familles-list">
        {familles.map((f) => (
          <option key={f.id} value={f.nom} />
        ))}
      </datalist>
      <datalist id="sousfamilles-list">
        {sousFamilles.map((sf) => (
          <option key={sf.id} value={sf.nom} />
        ))}
      </datalist>
      <datalist id="unites-list">
        {unites.map((u) => (
          <option key={u.id} value={u.nom} />
        ))}
      </datalist>
      <datalist id="zones-list">
        {zones.map((z) => (
          <option key={z.id} value={z.nom} />
        ))}
      </datalist>
    </>
  );
}
