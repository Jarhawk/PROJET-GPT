// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect, useCallback } from "react";
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useInventaireZones } from "@/hooks/useInventaireZones";
import TableContainer from "@/components/ui/TableContainer";
import InputField from "@/components/ui/InputField";

function EcartInventairePage() {
  const params = new URLSearchParams(window.location.search);
  const { mama_id, isAuthenticated } = useAuth();
  const { zones, getZones } = useInventaireZones();
  const [date, setDate] = useState(params.get("date") || "");
  const [zone, setZone] = useState(params.get("zone") || "");
  const [mois, setMois] = useState(params.get("mois") || "");
  const [mode] = useState(params.get("mode") || "");
  const [ecarts, setEcarts] = useState([]);

  const fetchEcarts = useCallback(async () => {
    if ((!date && !mois) || !zone || !mama_id) return;

    let all = [];

    if (mois) {
      const start = mois;
      const end = new Date(new Date(mois).getFullYear(), new Date(mois).getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);

      const rangeDates = [];
      for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
        rangeDates.push(new Date(d).toISOString().slice(0, 10));
      }

      for (const d of rangeDates) {
        const { data, error } = await supabase.rpc("calcul_ecarts_inventaire", {
          p_date: d,
          p_zone: zone,
          mama_id_param: mama_id,
        });
        if (!error && data.length > 0) {
          all.push(...data.map((e) => ({ ...e, date: d })));
        }
      }
    } else {
      const { data, error } = await supabase.rpc("calcul_ecarts_inventaire", {
        p_date: date,
        p_zone: zone,
        mama_id_param: mama_id,
      });
      if (!error) {
        all = data.map((e) => ({ ...e, date }));
      }
    }

    setEcarts(all);
  }, [date, mois, zone, mama_id]);

  const renderPDF = useCallback(() => {
    const rows = ecarts
      .map(
        (e) => `
      <tr>
        <td>${e.date || ""}</td>
        <td>${e.produit}</td>
        <td>${e.stock_theorique}</td>
        <td>${e.stock_reel}</td>
        <td>${e.ecart}</td>
        <td>${e.motif || ""}</td>
      </tr>`
      )
      .join("");

    const content = `
      <html>
        <head>
          <title>Écarts d'inventaire</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { color: #bfa14d; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px }
            th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
            th { background-color: #f4f4f4; }
          </style>
        </head>
        <body>
          <h1>Écarts d'inventaire – Zone : ${zone}</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Théorique</th>
                <th>Réel</th>
                <th>Écart</th>
                <th>Motif</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    win.document.write(content);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }, [ecarts, zone]);

  useEffect(() => {
    if (mama_id) {
      getZones();
    }
  }, [mama_id, getZones]);

  useEffect(() => {
    if (isAuthenticated && mama_id) fetchEcarts();
  }, [fetchEcarts, isAuthenticated, mama_id]);

  useEffect(() => {
    if (mode === "pdf" && zone && (date || mois) && mama_id) {
      fetchEcarts().then(() => setTimeout(() => renderPDF(), 500));
    }
  }, [mode, zone, date, mois, fetchEcarts, renderPDF, mama_id]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">Écarts d'inventaire</h1>

      <div className="flex gap-4 mb-6">
        <InputField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setMois("");
          }}
          className="flex-1"
        />
        <div className="flex-1">
          <InputField
            label="Zone"
            type="text"
            list="zones"
            placeholder="Zone (ex: bar, cuisine...)"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="w-full"
          />
          <datalist id="zones">
            {zones.map(z => (
              <option key={z.id} value={z.nom} />
            ))}
          </datalist>
        </div>
        <button
          onClick={renderPDF}
          className="bg-mamastock-gold text-white font-bold px-4 py-2 rounded self-end h-10"
        >
          📄 Export PDF
        </button>
      </div>

      <TableContainer className="mt-4">
        <table className="w-full text-sm">
          <thead className="bg-white/10 border-b border-white/20 text-white">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Produit</th>
              <th className="p-3 text-left">Théorique</th>
              <th className="p-3 text-left">Réel</th>
              <th className="p-3 text-left">Écart</th>
              <th className="p-3 text-left">Motif</th>
            </tr>
          </thead>
          <tbody>
            {ecarts.map((e, idx) => (
              <tr key={idx} className="border-b hover:bg-white/5">
                <td className="p-3">{e.date}</td>
                <td className="p-3">{e.produit}</td>
                <td className="p-3">{e.stock_theorique}</td>
                <td className="p-3">{e.stock_reel}</td>
                <td className={`p-3 font-bold ${e.ecart < 0 ? "text-red-600" : e.ecart > 0 ? "text-green-600" : "text-gray-600"}`}>
                  {e.ecart}
                </td>
                <td className="p-3 italic text-gray-500">{e.motif}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}

export default function EcartInventaire() {
  return (
    <EcartInventairePage />
  );
}
