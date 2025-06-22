import { useEffect, useState } from "react";
import { useUsageStats } from "@/hooks/useUsageStats";
import { useAuth } from "@/context/AuthContext";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function StatsDashboard() {
  const { mama_id } = useAuth();
  const { getModuleUsageCount, getFrequentErrors } = useUsageStats();
  const [modules, setModules] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mama_id) return;
    const load = async () => {
      setLoading(true);
      const m = await getModuleUsageCount();
      const e = await getFrequentErrors();
      setModules(m);
      setErrors(e);
      setLoading(false);
    };
    load();
  }, [mama_id]);

  return (
    <div className="p-8 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Statistiques d'usage</h1>
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="grid gap-6">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-2">Modules les plus utilisés</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modules}>
                <XAxis dataKey="module" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#bfa14d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-2">Erreurs fréquentes</h2>
            <ul className="list-disc pl-4">
              {errors.map((e) => (
                <li key={e.description}>{e.description} ({e.count})</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
