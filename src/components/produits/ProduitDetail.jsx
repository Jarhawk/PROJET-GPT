// src/components/produits/ProduitDetail.jsx
import { useEffect, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Dialog, DialogContent } from "@radix-ui/react-dialog";
import { Loader } from "lucide-react";

export default function ProduitDetail({ produitId, open, onClose }) {
  const { fetchProductPrices } = useProducts();
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && produitId) {
      setLoading(true);
      fetchProductPrices(produitId).then(h => {
        setHistorique(h || []);
        setLoading(false);
      });
    }
  }, [open, produitId, fetchProductPrices]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white/80 backdrop-blur-2xl border border-mamastockGold/20 rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        <h2 className="text-lg font-bold text-mamastockGold mb-3">Historique des prix d’achat</h2>
        {loading ? (
          <div className="flex justify-center py-6"><Loader className="animate-spin" /></div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Fournisseur</th>
                <th>Prix (€)</th>
                <th>Dernière livraison</th>
              </tr>
            </thead>
            <tbody>
              {historique.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4">Aucune donnée</td></tr>
              ) : historique.map((h, i) => (
                <tr key={i}>
                  <td>{h.updated_at?.slice(0, 10) || "-"}</td>
                  <td>{h.supplier?.nom || "-"}</td>
                  <td>{h.prix_achat ?? "-"}</td>
                  <td>{h.derniere_livraison?.slice(0, 10) || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="btn">Fermer</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
