// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { useZones } from "@/hooks/useZones";
import { useRequisitions } from "@/hooks/useRequisitions";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Requisitions() {
  const { mama_id, loading: authLoading } = useAuth();
  const { zones, fetchZones } = useZones();
  const { getRequisitions } = useRequisitions();
  const [requisitions, setRequisitions] = useState([]);
  const [statut, setStatut] = useState("");
  const [zone, setZone] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [periode, setPeriode] = useState({ debut: "", fin: "" });

  useEffect(() => {
    if (!mama_id || authLoading) return;
    fetchZones();
  }, [mama_id, authLoading]);

  useEffect(() => {
    if (!mama_id || authLoading || !periode.debut || !periode.fin) return;
    getRequisitions({ zone, statut, debut: periode.debut, fin: periode.fin, page })
      .then(({ data, count }) => { setRequisitions(data); setTotal(count); });
  }, [mama_id, authLoading, periode, zone, statut, page]);

  const filtered = requisitions;


  // Export Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map(r => ({
        Numero: r.numero,
        Date: r.date_demande,
        Statut: r.statut,
        Zone: zones.find(z => z.id === r.zone_id)?.nom || "-",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Requisitions");
    XLSX.writeFile(wb, "Requisitions.xlsx");
    toast.success("Export Excel généré !");
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Historique Réquisitions", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [["Numero", "Date", "Statut", "Zone"]],
      body: filtered.map(r => [
        r.numero,
        r.date_demande,
        r.statut,
        zones.find(z => z.id === r.zone_id)?.nom || "-",
      ]),
      styles: { fontSize: 9 },
    });
    doc.save("Requisitions.pdf");
    toast.success("Export PDF généré !");
  };

  const today = new Date().toISOString().slice(0, 10);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">Réquisitions (sortie stock)</h1>
      <div className="flex gap-4 mb-4 items-end">
        <div>
          <label className="block font-medium">Début période</label>
          <input
            type="date"
            className="input input-bordered"
            value={periode.debut}
            onChange={e => setPeriode(p => ({ ...p, debut: e.target.value }))}
          />
        </div>
        <div>
          <label className="block font-medium">Fin période</label>
          <input
            type="date"
            className="input input-bordered"
            value={periode.fin}
            onChange={e => setPeriode(p => ({ ...p, fin: e.target.value }))}
            max={today}
          />
        </div>
        <div>
          <label className="block font-medium">Zone</label>
          <select
            className="input input-bordered"
            value={zone}
            onChange={e => setZone(e.target.value)}
          >
            <option value="">Toutes</option>
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Statut</label>
          <input
            className="input input-bordered"
            value={statut}
            onChange={e => setStatut(e.target.value)}
          />
        </div>
        <Button onClick={handleExportExcel}>Export Excel</Button>
        <Button onClick={handleExportPDF}>Export PDF</Button>
        <Link to="/requisitions/nouvelle" className="btn">+ Nouvelle réquisition</Link>
      </div>
      <div className="bg-white/5 text-white border border-white/10 rounded-xl overflow-x-auto">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Numéro</th>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Statut</th>
              <th className="px-2 py-1">Zone</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td className="px-2 py-1">{r.numero}</td>
                <td className="px-2 py-1">{r.date_demande}</td>
                <td className="px-2 py-1">{r.statut}</td>
                <td className="px-2 py-1">{zones.find(z => z.id === r.zone_id)?.nom || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <Button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Précédent</Button>
        <span>Page {page}</span>
        <Button disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>Suivant</Button>
      </div>
    </div>
  );
}
