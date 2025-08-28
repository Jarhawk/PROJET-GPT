// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/pages/fournisseurs/comparatif/PrixFournisseurs.jsx
import { useComparatif } from "@/hooks/useComparatif";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";
import TableContainer from "@/components/ui/TableContainer";

// Affiche le comparatif des prix par fournisseur pour un produit

export default function PrixFournisseurs({ produitId }) {
  const { lignes, loading, error } = useComparatif(produitId);

  if (loading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (error) {
    return (
      <p className="text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 text-sm mt-2">
        {error.message || "Erreur de chargement"}
      </p>
    );
  }

  const rows = Array.isArray(lignes) ? lignes : [];
  if (rows.length === 0) {
    return <p className="text-gray-500 text-sm mt-2">Aucune donnée fournisseur pour ce produit.</p>;
  }

  return (
    <div className="text-sm">
      <GlassCard className="p-4">
        <TableContainer>
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/10 border-b border-white/20">
              <tr>
                <th className="px-2 py-1">Fournisseur</th>
                <th className="px-2 py-1 text-right">Dernier prix</th>
                <th className="px-2 py-1 text-right">PMP</th>
                <th className="px-2 py-1 text-center">Nb achats</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-2 py-1">{l.fournisseur}</td>
                  <td className="px-2 py-1 text-right">{parseFloat(l.dernierPrix).toFixed(2)} €</td>
                  <td className="px-2 py-1 text-right">{parseFloat(l.pmp).toFixed(2)} €</td>
                  <td className="px-2 py-1 text-center">{l.nb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      </GlassCard>
    </div>
  );
}
