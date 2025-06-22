import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStock } from "@/hooks/useStock";
import { Button } from "@/components/ui/button";

export default function InventairePage() {
  const { getInventaires } = useStock();
  const [inventaires, setInventaires] = useState([]);

  useEffect(() => {
    getInventaires().then(setInventaires);
  }, [getInventaires]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Inventaires</h1>
        <Button asChild>
          <Link to="/stock/inventaires/new">Créer un nouvel inventaire</Link>
        </Button>
      </div>
      <table className="min-w-full text-sm bg-white rounded shadow">
        <thead>
          <tr>
            <th className="p-2 text-left">Nom</th>
            <th className="p-2">Date</th>
            <th className="p-2">Utilisateur</th>
            <th className="p-2">État</th>
            <th className="p-2">Écart total</th>
          </tr>
        </thead>
        <tbody>
          {inventaires.map((inv) => (
            <tr key={inv.id}>
              <td className="p-2">{inv.nom || inv.reference}</td>
              <td className="p-2 text-center">{inv.date}</td>
              <td className="p-2 text-center">{inv.users?.username || "-"}</td>
              <td className="p-2 text-center">{inv.cloture ? "validé" : "en cours"}</td>
              <td className="p-2 text-center">{inv.ecart_total ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
