// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/pages/mouvements/Mouvements.jsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { useProducts } from "@/hooks/useProducts";
import { useMouvements } from "@/hooks/useMouvements";
import MouvementForm from "./MouvementForm";

export default function Mouvements() {
  const { products, fetchProducts } = useProducts();
  const { mouvements, getMouvements } = useMouvements();
  const [filters, setFilters] = useState({
    type: "",
    product: "",
    productName: "",
    zone: "",
    debut: "",
    fin: "",
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProducts({ limit: 1000 });
  }, [fetchProducts]);

  useEffect(() => {
    getMouvements({
      type: filters.type,
      produit: filters.product,
      zone: filters.zone,
      debut: filters.debut,
      fin: filters.fin,
    });
  }, [filters, getMouvements]);

  const handleProductInput = val => {
    setFilters(f => ({ ...f, productName: val }));
    const p = products.find(pr => pr.nom === val);
    setFilters(f => ({ ...f, product: p ? p.id : "" }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-shadow">
      <h1 className="text-2xl font-bold mb-4">Mouvements de stock</h1>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <select
          className="input"
          value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
        >
          <option value="">Tous types</option>
          <option value="entrée">Entrée</option>
          <option value="sortie">Sortie</option>
          <option value="transfert">Transfert</option>
          <option value="inventaire">Ajustement</option>
        </select>
        <div>
          <input
            className="input"
            list="liste-produits-filtre"
            placeholder="Produit"
            value={filters.productName}
            onChange={e => handleProductInput(e.target.value)}
          />
          <datalist id="liste-produits-filtre">
            {products.map(p => (
              <option key={p.id} value={p.nom} />
            ))}
          </datalist>
        </div>
        <input
          type="date"
          className="input"
          value={filters.debut}
          onChange={e => setFilters(f => ({ ...f, debut: e.target.value }))}
        />
        <input
          type="date"
          className="input"
          value={filters.fin}
          onChange={e => setFilters(f => ({ ...f, fin: e.target.value }))}
        />
        <input
          className="input"
          placeholder="Zone"
          value={filters.zone}
          onChange={e => setFilters(f => ({ ...f, zone: e.target.value }))}
        />
        <Button onClick={() => setShowForm(true)}>Ajouter un mouvement</Button>
      </div>
      <TableContainer>
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Produit</th>
              <th className="p-2">Quantité</th>
              <th className="p-2">Zone</th>
              <th className="p-2">Type</th>
              <th className="p-2">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {mouvements.map(m => (
              <tr key={m.id}>
                <td className="p-2">{m.date}</td>
                <td className="p-2">{products.find(p => p.id === m.produit_id)?.nom || ""}</td>
                <td className="p-2">{m.quantite}</td>
                <td className="p-2">{m.zone || ""}</td>
                <td className="p-2">{m.type}</td>
                <td className="p-2">{Number(m.valeur || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
      {showForm && <MouvementForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
