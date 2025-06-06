// src/pages/comparatif/PrixFournisseurs.jsx
import { useComparatif } from "@/hooks/useComparatif";

export default function PrixFournisseurs({ produitId }) {
  const { lignes } = useComparatif(produitId);

  if (!lignes || lignes.length === 0) {
    return <p className="text-gray-500 text-sm mt-2">Aucune donnée fournisseur pour ce produit.</p>;
  }

  return (
    <div className="border p-4 rounded text-sm bg-white shadow">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1">Fournisseur</th>
            <th className="px-2 py-1 text-right">Dernier prix</th>
            <th className="px-2 py-1 text-right">PMP</th>
            <th className="px-2 py-1 text-center">Nb achats</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-2 py-1">{l.fournisseur}</td>
              <td className="px-2 py-1 text-right">{parseFloat(l.dernierPrix).toFixed(2)} €</td>
              <td className="px-2 py-1 text-right">{parseFloat(l.pmp).toFixed(2)} €</td>
              <td className="px-2 py-1 text-center">{l.nb}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
