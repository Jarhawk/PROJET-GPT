import { useEffect, useState } from "react";
import { useStock } from "@/hooks/useStock";
import { Button } from "@/components/ui/button";
import MouvementForm from "./MouvementForm";

export default function MouvementsPage() {
  const { fetchMouvements, mouvements } = useStock();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchMouvements();
  }, [fetchMouvements]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Mouvements de stock</h1>
        <Button onClick={() => setShowForm(true)}>Nouveau mouvement</Button>
      </div>
      <table className="min-w-full text-sm bg-white rounded shadow">
        <thead>
          <tr>
            <th className="p-2">Date</th>
            <th className="p-2">Produit</th>
            <th className="p-2">Quantité</th>
            <th className="p-2">Type</th>
            <th className="p-2">Utilisateur</th>
          </tr>
        </thead>
        <tbody>
          {mouvements.map((m) => (
            <tr key={m.id}>
              <td className="p-2 text-center">{m.date}</td>
              <td className="p-2 text-center">{m.product_id}</td>
              <td className="p-2 text-center">{m.quantite}</td>
              <td className="p-2 text-center">{m.type}</td>
              <td className="p-2 text-center">{m.created_by || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showForm && <MouvementForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
