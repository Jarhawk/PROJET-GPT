import { useState, useEffect } from "react";
import { useEnrichedProducts } from "@/hooks/useEnrichedProducts";
import { useFamilles } from "@/hooks/useFamilles";
import { useUnites } from "@/hooks/useUnites";
import ProduitForm from "@/components/produits/ProduitForm";
import ProduitDetail from "@/components/produits/ProduitDetail";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

export default function Produits() {
  const { products, fetchProducts } = useEnrichedProducts();
  const { familles, fetchFamilles } = useFamilles();
  const { unites, fetchUnites } = useUnites();

  const [search, setSearch] = useState("");
  const [familleFilter, setFamilleFilter] = useState("");
  const [uniteFilter, setUniteFilter] = useState("");
  const [actifFilter, setActifFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchFamilles();
    fetchUnites();
  }, []);

  // Export Excel/XLSX
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(products);
    XLSX.utils.book_append_sheet(wb, ws, "Produits");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "produits.xlsx");
  };

  // Filtrage avancé et recherche
  const produitsFiltres = products.filter(p =>
    (!search || p.nom?.toLowerCase().includes(search.toLowerCase()) || p.famille?.toLowerCase().includes(search.toLowerCase())) &&
    (!familleFilter || p.famille === familleFilter) &&
    (!uniteFilter || p.unite === uniteFilter) &&
    (actifFilter === "all" || (actifFilter === "true" ? p.actif : !p.actif))
  );

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          placeholder="Recherche produit/famille"
        />
        <select className="input" value={familleFilter} onChange={e => setFamilleFilter(e.target.value)}>
          <option value="">Toutes familles</option>
          {familles.map(f => <option key={f.id} value={f.nom}>{f.nom}</option>)}
        </select>
        <select className="input" value={uniteFilter} onChange={e => setUniteFilter(e.target.value)}>
          <option value="">Toutes unités</option>
          {unites.map(u => <option key={u.id} value={u.nom}>{u.nom}</option>)}
        </select>
        <select className="input" value={actifFilter} onChange={e => setActifFilter(e.target.value)}>
          <option value="all">Tous</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
        <Button onClick={() => { setSelectedProduct(null); setShowForm(true); }}>
          Ajouter un produit
        </Button>
        <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
      </div>
      <motion.table
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-full bg-white rounded-xl shadow-md"
      >
        <thead>
          <tr>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Famille</th>
            <th className="px-4 py-2">Unité</th>
            <th className="px-4 py-2">Stock</th>
            <th className="px-4 py-2">Actif</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {produitsFiltres.map((product) => (
            <tr key={product.id}>
              <td className="border px-4 py-2">
                <Button
                  variant="link"
                  className="font-semibold text-mamastockGold"
                  onClick={() => { setSelectedProduct(product); setShowForm(false); }}
                >
                  {product.nom}
                </Button>
              </td>
              <td className="border px-4 py-2">{product.famille}</td>
              <td className="border px-4 py-2">{product.unite}</td>
              <td className="border px-4 py-2">{product.stock}</td>
              <td className="border px-4 py-2">
                <span className={product.actif ? "badge badge-admin" : "badge badge-user"}>
                  {product.actif ? "Actif" : "Inactif"}
                </span>
              </td>
              <td className="border px-4 py-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedProduct(product); setShowForm(true); }}
                  className="mr-2"
                >
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedProduct(product)}
                >
                  Détail
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </motion.table>

      {showForm && (
        <ProduitForm
          produit={selectedProduct}
          familles={familles}
          unites={unites}
          onClose={() => { setShowForm(false); setSelectedProduct(null); fetchProducts(); }}
        />
      )}
      {selectedProduct && !showForm && (
        <ProduitDetail
          produit={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          refreshList={fetchProducts}
        />
      )}
    </div>
  );
}
