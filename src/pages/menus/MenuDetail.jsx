// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { toast } from 'sonner';

export default function MenuDetail({ menu, onClose, onDuplicate }) {
  const fiches = Array.isArray(menu?.fiches) ? menu.fiches : [];

  // Export Excel d'un menu
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const names = [];
    for (const f of fiches) {
      names.push(f.fiche?.nom);
    }
    const ws = XLSX.utils.json_to_sheet([{ ...menu, fiches: names.join(", ") }]);
    XLSX.utils.book_append_sheet(wb, ws, "Menu");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `menu_${menu.id}.xlsx`);
  };

  const exportPDF = () => {
    toast.success("Export PDF non implémenté (plug jsPDF)");
  };

  const totalCout = fiches.reduce((sum, f) => sum + (Number(f.fiche?.cout_total) || 0), 0);
  const totalPortions = fiches.reduce((sum, f) => sum + (Number(f.fiche?.portions) || 0), 0);
  const coutPortion = totalPortions > 0 ? totalCout / totalPortions : 0;

  const historique = Array.isArray(menu?.historique) ? menu.historique : [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-8 min-w-[400px] max-w-[95vw] flex flex-col gap-2 relative text-white">
        <Button variant="outline" className="absolute top-2 right-2" onClick={onClose}>Fermer</Button>
        <h2 className="font-bold text-xl mb-4">{menu.nom}</h2>
        <div><b>Date :</b> {menu.date}</div>
        <div>
          <b>Fiches :</b>
          <TableContainer className="mt-1">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2">Nom</th>
                  <th className="px-2">Portions</th>
                  <th className="px-2">Coût</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows = [];
                  for (let i = 0; i < fiches.length; i++) {
                    const f = fiches[i];
                    rows.push(
                      <tr key={i}>
                        <td className="border px-2">{f.fiche?.nom}</td>
                        <td className="border px-2 text-center">{f.fiche?.portions}</td>
                        <td className="border px-2">{Number(f.fiche?.cout_total || 0).toFixed(2)} €</td>
                      </tr>
                    );
                  }
                  return rows;
                })()}
              </tbody>
            </table>
          </TableContainer>
        </div>
        <div className="mt-2 flex gap-4">
          <div><b>Total :</b> {totalCout.toFixed(2)} €</div>
          <div><b>Coût/portion :</b> {coutPortion.toFixed(2)} €</div>
        </div>
        <div>
          <b>Document :</b> {menu.document ?
            <a href={menu.document} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Voir document</a> :
            <span className="text-gray-400">Aucun</span>
          }
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
          <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
          {onDuplicate && (
            <Button variant="outline" onClick={() => onDuplicate(menu)}>Dupliquer</Button>
          )}
        </div>
        <div className="mt-4">
          <b>Historique :</b>
          <ul className="list-disc pl-6">
            {(() => {
              const items = [];
              for (let i = 0; i < historique.length; i++) {
                const h = historique[i];
                items.push(<li key={i}>{h.date} — {h.user} — {h.action}</li>);
              }
              return items;
            })()}
          </ul>
        </div>
      </div>
    </div>
  );
}
