import { validateProduitRow } from "@/utils/excelUtils";

export default function ImportPreviewTable({ rows = [], onUpdate, maps, reference = {} }) {
  const { familles = [], sousFamilles = [], unites = [], zones = [] } = reference;
  const rowList = Array.isArray(rows) ? rows : [];
  const famList = Array.isArray(familles) ? familles : [];
  const sousList = Array.isArray(sousFamilles) ? sousFamilles : [];
  const uniteList = Array.isArray(unites) ? unites : [];
  const zoneList = Array.isArray(zones) ? zones : [];

  function handleChange(index, field, value) {
    const updated = [...rowList];
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
          {(() => {
            const elements = [];
            for (let idx = 0; idx < rowList.length; idx++) {
              const row = rowList[idx];
              elements.push(
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
              );
            }
            return elements;
          })()}
        </tbody>
      </table>
      <datalist id="familles-list">
        {(() => {
          const opts = [];
          for (const f of famList) {
            opts.push(<option key={f.id} value={f.nom} />);
          }
          return opts;
        })()}
      </datalist>
      <datalist id="sousfamilles-list">
        {(() => {
          const opts = [];
          for (const sf of sousList) {
            opts.push(<option key={sf.id} value={sf.nom} />);
          }
          return opts;
        })()}
      </datalist>
      <datalist id="unites-list">
        {(() => {
          const opts = [];
          for (const u of uniteList) {
            opts.push(<option key={u.id} value={u.nom} />);
          }
          return opts;
        })()}
      </datalist>
      <datalist id="zones-list">
        {(() => {
          const opts = [];
          for (const z of zoneList) {
            opts.push(<option key={z.id} value={z.nom} />);
          }
          return opts;
        })()}
      </datalist>
    </>
  );
}
