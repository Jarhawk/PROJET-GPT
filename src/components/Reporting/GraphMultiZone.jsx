// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
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
import { useRef, useState, useMemo } from "react";
import html2canvas from "html2canvas";
import { makeId } from "@/utils/formIds";

const allZones = [
  { key: "cost_cuisine", label: "Cuisine", color: "#bfa14d" },
  { key: "cost_bar", label: "Bar", color: "#8884d8" },
  { key: "cost_frigo", label: "Frigo", color: "#82ca9d" },
  { key: "cost_cave", label: "Cave", color: "#ff7f50" },
];

export default function GraphMultiZone({ data }) {
  const chartRef = useRef(null);
  const initialSelected = [];
  for (const z of allZones) initialSelected.push(z.key);
  const [selectedZones, setSelectedZones] = useState(initialSelected);
  const checkboxIds = useMemo(() => {
    const entries = [];
    for (const z of allZones) {
      entries.push([z.key, makeId('fld')]);
    }
    return Object.fromEntries(entries);
  }, []);

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
          className="text-sm px-3 py-1 bg-mamastock-gold text-white rounded hover:bg-mamastock-gold-hover"
        >
          Exporter en PNG
        </button>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap text-white">
        {(() => {
          const labels = [];
          for (const zone of allZones) {
            const id = checkboxIds[zone.key];
            labels.push(
              <label key={zone.key} htmlFor={id} className="flex items-center gap-2 text-sm">
                <input
                  id={id}
                  type="checkbox"
                  checked={selectedZones.includes(zone.key)}
                  onChange={() => toggleZone(zone.key)}
                />
                {zone.label}
              </label>
            );
          }
          return labels;
        })()}
      </div>

      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="periode" />
            <YAxis />
            <Tooltip />
            <Legend />
            {(() => {
              const lines = [];
              for (const zone of allZones) {
                if (selectedZones.includes(zone.key)) {
                  lines.push(
                    <Line
                      key={zone.key}
                      type="monotone"
                      dataKey={zone.key}
                      name={zone.label}
                      stroke={zone.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  );
                }
              }
              return lines;
            })()}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
