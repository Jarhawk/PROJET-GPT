// src/pages/Produits.jsx
import { useEffect, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import ProduitFormModal from "@/components/produits/ProduitFormModal";
import ProduitDetail from "@/components/produits/ProduitDetail";
import { Button } from "@/components/ui/button";
import { Toaster } from "react-hot-toast";

export default function Produits() {
  const {
    products,
    fetchProducts,
    exportProductsToExcel,
  } = useProducts();

  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Filtre et familles/unites dynamiques
  const familles = [...new Set(products.map(p => p.famille).filter(Boolean))];
  const unites = [...new Set(products.map(p => p.unite).filter(Boolean))];

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastockGold mb-4">Produits stock</h1>
      <div className="flex gap-2 mb-6">
        <Button onClick={() => { setShowForm(true); setSelectedProduct(null); }}>+ Nouveau produit</Button>
        <Button onClick={exportProductsToExcel}>Export Excel</Button>
      </div>
      <div className="bg-white/70 shadow rounded-xl overflow-x-auto">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Famille</th>
              <th>Unité</th>
              <th>PMP (€)</th>
              <th>Stock</th>
              <th>Actif</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.nom}</td>
                <td>{p.famille}</td>
                <td>{p.unite}</td>
                <td>{p.pmp}</td>
                <td>{p.stock_reel}</td>
                <td>{p.actif ? "✅" : "❌"}</td>
                <td>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedProduct(p); setShowForm(true); }}>
                    Éditer
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedProduct(p); setShowDetail(true); }}>
                    Historique prix
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modale création/édition */}
      <ProduitFormModal
        open={showForm}
        produit={selectedProduct}
        familles={familles}
        unites={unites}
        onClose={() => { setShowForm(false); setSelectedProduct(null); fetchProducts(); }}
        onSuccess={() => { fetchProducts(); }}
      />
      {/* Modale détail historique */}
      <ProduitDetail
        produitId={selectedProduct?.id}
        open={showDetail}
        onClose={() => { setShowDetail(false); setSelectedProduct(null); }}
      />
    </div>
  );
}
