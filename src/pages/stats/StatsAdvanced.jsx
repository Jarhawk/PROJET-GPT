import { useEffect } from "react";
import { useAdvancedStats } from "@/hooks/useAdvancedStats";
import { useAuth } from "@/context/AuthContext";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function StatsAdvanced() {
  const { data, loading, error, fetchStats } = useAdvancedStats();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    fetchStats();
  }, [fetchStats, isAuthenticated, authLoading]);

  if (loading) return <LoadingSpinner message="Chargement..." />;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Analytique avancée</h1>
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
