// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStock } from "@/hooks/useStock";
import { Button } from "@/components/ui/button";
import ListingContainer from "@/components/ui/ListingContainer";
import TableHeader from "@/components/ui/TableHeader";

export default function InventairePage() {
  const { getInventaires } = useStock();
  const [inventaires, setInventaires] = useState([]);

  useEffect(() => {
    getInventaires().then(setInventaires);
  }, [getInventaires]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Inventaires</h1>
      <TableHeader className="justify-end mb-2">
        <Button asChild>
          <Link to="/inventaire/new">Créer un nouvel inventaire</Link>
        </Button>
      </TableHeader>
      <ListingContainer>
        <table className="text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left">Référence</th>
              <th className="p-2">Date</th>
              <th className="p-2">Utilisateur</th>
              <th className="p-2">État</th>
              <th className="p-2 text-right">Écart total</th>
            </tr>
          </thead>
          <tbody>
            {inventaires.map((inv) => (
              <tr key={inv.id}>
                <td className="p-2">{inv.reference}</td>
                <td className="p-2">{inv.date_inventaire}</td>
                <td className="p-2">{inv.utilisateurs?.username || "-"}</td>
                <td className="p-2">{inv.cloture ? "validé" : "en cours"}</td>
                <td className="p-2 text-right">{inv.ecart_total ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListingContainer>
    </div>
  );
}
