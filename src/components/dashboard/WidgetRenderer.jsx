// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Tooltip } from "recharts";
import DashboardCard from "./DashboardCard";

export default function WidgetRenderer({ config }) {
  if (!config) return null;
  const type = config.type || "indicator";

  switch (type) {
    case "line":
      return (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={config.data || []}>
            <Line type="monotone" dataKey={config.dataKey} stroke={config.color || "#bfa14d"} />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      );
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={config.data || []}>
            <Bar dataKey={config.dataKey} fill={config.color || "#bfa14d"} />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={config.data || []} dataKey={config.dataKey} nameKey={config.nameKey} outerRadius={80} fill={config.color || "#bfa14d"}>
              {(config.data || []).map((_, idx) => (
                <Cell key={idx} fill={config.colors?.[idx % config.colors.length] || "#bfa14d"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    case "list":
      return (
        <ul className="list-disc pl-4 text-sm">
          {(config.items || []).map((it, idx) => (
            <li key={idx}>{it}</li>
          ))}
        </ul>
      );
    case "indicator":
    default:
      return (
        <DashboardCard title={config.label} value={config.value} type={config.indicatorType} />
      );
  }
}
