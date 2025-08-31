// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import { useAuth } from '@/hooks/useAuth';
import { useCostCenters } from "@/hooks/useCostCenters";
import { useFamilles } from "@/hooks/useFamilles";
import { useAnalytique } from "@/hooks/useAnalytique";

export default function AnalytiqueDashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { costCenters, fetchCostCenters } = useCostCenters();
  const { familles, fetchFamilles } = useFamilles();
  const { getConsommationParActivite, getVentilationProduits } = useAnalytique();

  const [filters, setFilters] = useState({ famille: "", centre: "", debut: "" });
  const [dataActivite, setDataActivite] = useState([]);
  const [dataProduits, setDataProduits] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    fetchCostCenters();
    fetchFamilles();
  }, [isAuthenticated, authLoading, fetchCostCenters, fetchFamilles]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    const periode = filters.debut ? { debut: filters.debut + "-01", fin: filters.debut + "-31" } : {};
    getConsommationParActivite(periode, filters.centre || null).then(setDataActivite);
    getVentilationProduits(periode, filters.centre || null).then(data => {
      const list = Array.isArray(data) ? data : [];
      const filtered = [];
      if (filters.famille) {
        for (let i = 0; i < list.length; i++) {
          const d = list[i];
          if (d.famille === filters.famille) filtered.push(d);
        }
      } else {
        for (let i = 0; i < list.length; i++) filtered.push(list[i]);
      }
      setDataProduits(filtered);
    });
  }, [isAuthenticated, authLoading, filters, getConsommationParActivite, getVentilationProduits]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataProduits), "Ventilation");
    XLSX.writeFile(wb, "analytique.xlsx");
  };

  return (
    <div className="p-8 container mx-auto">
            <h1 className="text-2xl font-bold mb-4">Dashboard analytique</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="form-input" value={filters.centre} onChange={e => setFilters(f => ({ ...f, centre: e.target.value }))}>
          <option value="">Tous centres</option>
          {(() => {
            const opts = [];
            const list = Array.isArray(costCenters) ? costCenters : [];
            for (let i = 0; i < list.length; i++) {
              const c = list[i];
              opts.push(<option key={c.id} value={c.id}>{c.nom}</option>);
            }
            return opts;
          })()}
        </select>
        <select className="form-input" value={filters.famille} onChange={e => setFilters(f => ({ ...f, famille: e.target.value }))}>
          <option value="">Toutes familles</option>
          {(() => {
            const opts = [];
            const list = Array.isArray(familles) ? familles : [];
            for (let i = 0; i < list.length; i++) {
              const f = list[i];
              opts.push(<option key={f.id} value={f.nom}>{f.nom}</option>);
            }
            return opts;
          })()}
        </select>
        <input type="month" className="form-input" value={filters.debut} onChange={e => setFilters(f => ({ ...f, debut: e.target.value }))} />
      </div>
      <Button variant="outline" className="mb-4" onClick={exportExcel}>Export Excel</Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-4">
          <h3 className="font-semibold mb-2">Consommation par activité</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Array.isArray(dataActivite) ? dataActivite : []}>
              <XAxis dataKey="activite" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sumv" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard className="p-4">
          <h3 className="font-semibold mb-2">Ventilation produits</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={Array.isArray(dataProduits) ? dataProduits : []} dataKey="sumv" nameKey="famille" label>
                {(() => {
                  const cells = [];
                  const list = Array.isArray(dataProduits) ? dataProduits : [];
                  const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
                  for (let i = 0; i < list.length; i++) {
                    cells.push(<Cell key={i} fill={colors[i % 4]} />);
                  }
                  return cells;
                })()}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
