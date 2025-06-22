import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
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
      const filtered = filters.famille ? data.filter(d => d.famille === filters.famille) : data;
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
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Dashboard analytique</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="input" value={filters.centre} onChange={e => setFilters(f => ({ ...f, centre: e.target.value }))}>
          <option value="">Tous centres</option>
          {costCenters.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        <select className="input" value={filters.famille} onChange={e => setFilters(f => ({ ...f, famille: e.target.value }))}>
          <option value="">Toutes familles</option>
          {familles.map(f => (
            <option key={f.id} value={f.nom}>{f.nom}</option>
          ))}
        </select>
        <input type="month" className="input" value={filters.debut} onChange={e => setFilters(f => ({ ...f, debut: e.target.value }))} />
      </div>
      <Button variant="outline" className="mb-4" onClick={exportExcel}>Export Excel</Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Consommation par activité</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataActivite}>
              <XAxis dataKey="activite" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sumv" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Ventilation produits</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={dataProduits} dataKey="sumv" nameKey="famille" label>
                {dataProduits.map((_, i) => (
                  <Cell key={i} fill={["#0088FE", "#00C49F", "#FFBB28", "#FF8042"][i % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
