// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useAdvancedStats } from "@/hooks/useAdvancedStats";
import useAuth from "@/hooks/useAuth";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

export default function StatsAdvanced() {
  const { data, loading, error, fetchStats } = useAdvancedStats();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    fetchStats({ start, end });
  }, [fetchStats, isAuthenticated, authLoading, start, end]);

  const refresh = () => fetchStats({ start, end });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stats');
    XLSX.writeFile(wb, 'advanced_stats.xlsx');
  };

  if (loading) return <LoadingSpinner message="Chargement..." />;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Analytique avancée</h1>
      <div className="flex items-end gap-2 mb-4">
        <div>
          <label className="block text-xs">Début</label>
          <input type="month" className="input" value={start}
            onChange={e => setStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs">Fin</label>
          <input type="month" className="input" value={end}
            onChange={e => setEnd(e.target.value)} />
        </div>
        <Button onClick={refresh}>Rafraîchir</Button>
        <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="purchases" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
