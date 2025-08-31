// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
} from 'recharts'

const median = arr => {
  const s = [...arr].sort((a, b) => a - b)
  return s.length ? s[Math.floor(s.length / 2)] : 0
}

export default function EngineeringChart({ data, type }) {
  const rows = Array.isArray(data) ? data : []
  if (type === 'radar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={rows}>
          <PolarGrid />
          <PolarAngleAxis dataKey="nom" />
          <PolarRadiusAxis />
          <Radar dataKey="marge" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    )
  }
  if (type === 'histogram') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid />
          <XAxis dataKey="nom" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="ventes" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    )
  }
  if (type === 'heatmap') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name="Popularité" unit="%" />
          <YAxis type="number" dataKey="y" name="Marge" unit="%" />
          <ZAxis type="number" dataKey="ventes" range={[0, 400]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={rows} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    )
  }
  // default matrix chart
  const xs = []
  const ys = []
  for (const d of rows) {
    xs.push(d.x)
    ys.push(d.y)
  }
  const medianPop = median(xs)
  const medianMarge = median(ys)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="Popularité" unit="%" />
        <YAxis type="number" dataKey="y" name="Marge" unit="%" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <ReferenceLine x={medianPop} stroke="grey" />
        <ReferenceLine y={medianMarge} stroke="grey" />
        <Scatter data={rows} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
