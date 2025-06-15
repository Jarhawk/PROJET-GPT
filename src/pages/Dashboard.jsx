import { useEffect, useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { usePriceTrends } from "@/hooks/usePriceTrends";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

export default function Dashboard() {
  const {
    stats,
    evolutionStock,
    evolutionConso,
    topProducts,
    foodCostGlobal,
    foodCostParFamille,
    evolutionFoodCost,
    margeBrute,
    alertesStockBas,
    fetchDashboard,
    exportExcelDashboard,
  } = useDashboard();

  const [caFnb, setCaFnb] = useState(stats?.ca_fnb || 0);
  const [trendProduct, setTrendProduct] = useState(null);
  const { data: priceTrend, fetchTrends } = usePriceTrends(trendProduct);

  useEffect(() => {
    if (topProducts.length > 0 && !trendProduct) {
      setTrendProduct(topProducts[0].id);
    }
  }, [topProducts, trendProduct]);

  useEffect(() => {
    if (trendProduct) fetchTrends(trendProduct);
  }, [trendProduct, fetchTrends]);

  useEffect(() => { fetchDashboard(caFnb); }, [caFnb]);

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6">Dashboard Stock & Achats</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">Stock valorisé</div>
            <div className="text-2xl font-bold">{stats?.stock_valorise?.toLocaleString()} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">Consommation du mois</div>
            <div className="text-2xl font-bold">{stats?.conso_mois?.toLocaleString()} €</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">Nb mouvements stock</div>
            <div className="text-2xl font-bold">{stats?.nb_mouvements || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs text-gray-500 mb-1">CA F&B mois (€)</div>
            <input
              type="number"
              className="input w-full mb-1"
              value={caFnb}
              onChange={e => setCaFnb(Number(e.target.value))}
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Food cost global (%)</span>
              <span className="text-xl font-bold">
                {foodCostGlobal !== undefined ? (foodCostGlobal * 100).toFixed(1) + " %" : "-"}
              </span>
              <span className="text-xs text-gray-500 mt-1">Marge brute (%)</span>
              <span className={`text-xl font-bold ${
                margeBrute?.taux < 0.7 ? "text-red-600" : "text-green-600"
              }`}>
                {margeBrute?.taux !== undefined ? (margeBrute.taux * 100).toFixed(1) + " %" : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="font-semibold mb-2">Évolution valorisation stock</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={evolutionStock}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="stock_valorise" stroke="#bfa14d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="font-semibold mb-2">Consommation (12 derniers mois)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={evolutionConso}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="conso" fill="#0f1c2e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Food cost par famille */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8">
        <h2 className="font-semibold mb-2">Food cost par famille</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={foodCostParFamille}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="famille" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="food_cost" fill="#bfa14d">
              {foodCostParFamille.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.food_cost > 0.35 ? "#d7263d" : "#0f1c2e"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Évolution food cost (line chart) */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8">
        <h2 className="font-semibold mb-2">Évolution food cost (%)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={evolutionFoodCost}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" />
            <YAxis domain={[0, 1]} tickFormatter={v => (v * 100).toFixed(0) + "%"} />
            <Tooltip formatter={v => (v * 100).toFixed(1) + "%"} />
            <Line type="monotone" dataKey="food_cost" stroke="#d7263d" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top produits consommés */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8">
        <h2 className="font-semibold mb-2">Top produits consommés</h2>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={topProducts}
              dataKey="total"
              nameKey="nom"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#bfa14d"
              label
            >
              {topProducts.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={["#bfa14d", "#0f1c2e", "#d7263d", "#f46036", "#2e294e"][index % 5]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tendance prix d'achat */}
      {trendProduct && (
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <h2 className="font-semibold mb-2">Tendance prix d'achat</h2>
          <select
            className="input mb-2"
            value={trendProduct}
            onChange={e => setTrendProduct(e.target.value)}
          >
            {topProducts.map(tp => (
              <option key={tp.id} value={tp.id}>{tp.nom}</option>
            ))}
          </select>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={priceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="prix_moyen" stroke="#0f1c2e" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Alertes stocks bas */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-8">
        <h2 className="font-semibold mb-2">Alertes stocks bas</h2>
        <table className="min-w-full bg-gray-50 rounded text-xs">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Stock réel</th>
              <th>Stock min</th>
              <th>Unité</th>
            </tr>
          </thead>
          <tbody>
            {alertesStockBas.map(a => (
              <tr key={a.id}>
                <td className="font-semibold">{a.nom}</td>
                <td>{a.stock_reel}</td>
                <td className="text-red-600 font-bold">{a.stock_min}</td>
                <td>{a.unite}</td>
              </tr>
            ))}
            {alertesStockBas.length === 0 && (
              <tr><td colSpan={4} className="text-gray-400">Aucun stock bas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={exportExcelDashboard}>Export Excel (stats)</Button>
        <Button variant="outline" onClick={() => toast("Export PDF à brancher")}>Export PDF (à venir)</Button>
      </div>
    </div>
  );
}
