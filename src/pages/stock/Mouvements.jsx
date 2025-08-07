// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { useProducts } from "@/hooks/useProducts";
import { useZones } from "@/hooks/useZones";
import { useMouvements } from "@/hooks/useMouvements";
import MouvementForm from "./MouvementForm";

export default function Mouvements() {
  const { products, fetchProducts } = useProducts();
  const { zones, fetchZones } = useZones();
  const { mouvements, fetchMouvements } = useMouvements();
  const [filters, setFilters] = useState({
    type: "",
    produit: "",
    zone: "",
    debut: "",
    fin: "",
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProducts({ limit: 1000 });
    fetchZones();
  }, [fetchProducts, fetchZones]);

  useEffect(() => {
    fetchMouvements(filters);
  }, [filters, fetchMouvements]);

  const zoneName = id => zones.find(z => z.id === id)?.nom || "";

  return (
    <div className="p-6 max-w-6xl mx-auto text-shadow">
      <h1 className="text-2xl font-bold mb-4">Mouvements de stock</h1>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <select
          aria-label="Type"
          className="form-input"
          value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
        >
          <option value="">Tous types</option>
          <option value="entree_manuelle">Entrée manuelle</option>
          <option value="sortie_manuelle">Sortie manuelle</option>
          <option value="ajustement">Ajustement</option>
        </select>
        <select
          aria-label="Produit"
          className="form-input"
          value={filters.produit}
          onChange={e => setFilters(f => ({ ...f, produit: e.target.value }))}
        >
          <option value="">Tous produits</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </select>
        <select
          aria-label="Zone"
          className="form-input"
          value={filters.zone}
          onChange={e => setFilters(f => ({ ...f, zone: e.target.value }))}
        >
          <option value="">Toutes zones</option>
          {zones.map(z => (
            <option key={z.id} value={z.id}>{z.nom}</option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Début"
          className="form-input"
          value={filters.debut}
          onChange={e => setFilters(f => ({ ...f, debut: e.target.value }))}
        />
        <input
          type="date"
          aria-label="Fin"
          className="form-input"
          value={filters.fin}
          onChange={e => setFilters(f => ({ ...f, fin: e.target.value }))}
        />
        <Button onClick={() => setShowForm(true)}>Ajouter un mouvement</Button>
      </div>
      <TableContainer>
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Type</th>
              <th className="p-2">Produit</th>
              <th className="p-2">Quantité</th>
              <th className="p-2">Unité</th>
              <th className="p-2">Zone</th>
              <th className="p-2">Origine</th>
            </tr>
          </thead>
          <tbody>
            {mouvements.map(m => (
              <tr key={m.id}>
                <td className="p-2">{m.date?.slice(0, 10)}</td>
                <td className="p-2">{m.type}</td>
                <td className="p-2">{m.produits?.nom || ""}</td>
                <td className="p-2">{m.quantite}</td>
                <td className="p-2">{m.produits?.unite || ""}</td>
                <td className="p-2">{zoneName(m.zone_id)}</td>
                <td className="p-2">
                  {m.inventaire_id
                    ? "inventaire"
                    : m.transfert_id
                    ? "transfert"
                    : "manuel"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
      {showForm && <MouvementForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
