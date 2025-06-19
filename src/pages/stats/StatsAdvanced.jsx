import { useEffect } from "react";
import { useAdvancedStats } from "@/hooks/useAdvancedStats";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Toaster } from "react-hot-toast";

export default function StatsAdvanced() {
  const { data, loading, error, fetchStats } = useAdvancedStats();

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className="p-8">Chargement...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Analytique avancée</h1>
      <ResponsiveContainer width="100%" height={300} role="img" aria-label="Graphique analytique avancé">
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
