// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
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

export default function GraphCost({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="periode" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="food_cost" name="Cost Food %" stroke="#bfa14d" />
        <Line type="monotone" dataKey="boisson_cost" name="Cost Boisson %" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
