// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useStock } from "@/hooks/useStock";
import { Button } from "@/components/ui/button";
import ListingContainer from "@/components/ui/ListingContainer";
import TableHeader from "@/components/ui/TableHeader";
import MouvementForm from "./MouvementForm";

export default function MouvementsPage() {
  const { fetchMouvements, mouvements } = useStock();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchMouvements();
  }, [fetchMouvements]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Mouvements de stock</h1>
      <TableHeader className="justify-end mb-2">
        <Button onClick={() => setShowForm(true)}>Nouveau mouvement</Button>
      </TableHeader>
      <ListingContainer>
        <table className="text-sm">
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
                <td className="p-2">{m.date}</td>
                <td className="p-2">{m.produit_id}</td>
                <td className="p-2 text-right">{m.quantite}</td>
                <td className="p-2">{m.type}</td>
                <td className="p-2">{m.auteur_id || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListingContainer>
      {showForm && <MouvementForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
