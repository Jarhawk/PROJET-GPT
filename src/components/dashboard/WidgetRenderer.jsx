// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Tooltip } from "recharts";
import DashboardCard from "./DashboardCard";

export default function WidgetRenderer({ config }) {
  if (!config) return null;
  const type = config.type || "indicator";
    const data = Array.isArray(config.data) ? config.data : [];
    const items = Array.isArray(config.items) ? config.items : [];
    const colors = Array.isArray(config.colors) ? config.colors : [];

  switch (type) {
    case "line":
      return (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <Line type="monotone" dataKey={config.dataKey} stroke={config.color || "#bfa14d"} />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      );
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <Bar dataKey={config.dataKey} fill={config.color || "#bfa14d"} />
            <Tooltip />
          </BarChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey={config.dataKey}
              nameKey={config.nameKey}
              outerRadius={80}
              fill={config.color || "#bfa14d"}
            >
              {(() => {
                const cells = []
                for (let idx = 0; idx < data.length; idx++) {
                  cells.push(
                    <Cell
                      key={idx}
                      fill={colors[idx % colors.length] || "#bfa14d"}
                    />
                  )
                }
                return cells
              })()}
            </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case "list":
        return (
          {(() => {
            const listItems = []
            for (let idx = 0; idx < items.length; idx++) {
              listItems.push(<li key={idx}>{items[idx]}</li>)
            }
            return <ul className="list-disc pl-4 text-sm">{listItems}</ul>
          })()}
        );
    case "indicator":
    default:
      return (
        <DashboardCard title={config.label} value={config.value} type={config.indicatorType} />
      );
  }
}
