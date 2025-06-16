import { useEffect, useState } from "react";
import CostCenterAllocationModal from "@/components/analytics/CostCenterAllocationModal";
import { useUnallocatedMovements } from "@/hooks/useUnallocatedMovements";

export default function MouvementsAVentiler() {
  const { fetchUnallocated } = useUnallocatedMovements();
  const [mouvements, setMouvements] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchUnallocated().then(setMouvements);
  }, [fetchUnallocated]);

  return (
    <div className="p-8 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mouvements à ventiler</h1>
      <table className="min-w-full text-xs bg-white rounded-xl shadow-md">
        <thead>
          <tr>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1">Produit</th>
            <th className="px-2 py-1">Quantité</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {mouvements.map(m => (
            <tr key={m.id}>
              <td className="px-2 py-1">{new Date(m.created_at).toLocaleDateString()}</td>
              <td className="px-2 py-1">{m.product_id}</td>
              <td className="px-2 py-1">{m.quantite}</td>
              <td className="px-2 py-1">
                <button className="btn btn-outline" onClick={() => setSelected(m)}>Ventiler</button>
              </td>
            </tr>
          ))}
          {mouvements.length === 0 && (
            <tr><td colSpan={4} className="text-center p-4">Aucun mouvement</td></tr>
          )}
        </tbody>
      </table>
      <CostCenterAllocationModal
        mouvementId={selected?.id}
        productId={selected?.product_id}
        open={!!selected}
        onOpenChange={v => !v && setSelected(null)}
      />
    </div>
  );
}
