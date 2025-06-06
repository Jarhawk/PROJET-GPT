// src/components/Reporting/GraphMultiZone.jsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";

const allZones = [
  { key: "cost_cuisine", label: "Cuisine", color: "#bfa14d" },
  { key: "cost_bar", label: "Bar", color: "#8884d8" },
  { key: "cost_frigo", label: "Frigo", color: "#82ca9d" },
  { key: "cost_cave", label: "Cave", color: "#ff7f50" },
];

export default function GraphMultiZone({ data }) {
  const chartRef = useRef(null);
  const [selectedZones, setSelectedZones] = useState(allZones.map(z => z.key));

  const toggleZone = (key) => {
    setSelectedZones((prev) =>
      prev.includes(key) ? prev.filter((z) => z !== key) : [...prev, key]
    );
  };

  const exportImage = async () => {
    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current);
      const link = document.createElement("a");
      link.download = "comparatif_zones.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Comparatif par zone</h3>
        <button
          onClick={exportImage}
          className="text-sm px-3 py-1 bg-mamastock-gold text-white rounded hover:bg-mamastock-goldHover"
        >
          Exporter en PNG
        </button>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap text-white">
        {allZones.map((zone) => (
          <label key={zone.key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedZones.includes(zone.key)}
              onChange={() => toggleZone(zone.key)}
            />
            {zone.label}
          </label>
        ))}
      </div>

      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="periode" />
            <YAxis />
            <Tooltip />
            <Legend />
            {allZones
              .filter((z) => selectedZones.includes(z.key))
              .map((zone) => (
                <Line
                  key={zone.key}
                  type="monotone"
                  dataKey={zone.key}
                  name={zone.label}
                  stroke={zone.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
