// src/pages/Produits.jsx
import { useEffect, useState, useRef } from "react";
import { useProducts } from "@/hooks/useProducts";
import ProduitFormModal from "@/components/produits/ProduitFormModal";
import ProduitDetail from "@/components/produits/ProduitDetail";
import { Button } from "@/components/ui/button";
import { Toaster } from "react-hot-toast";

const PAGE_SIZE = 20;

export default function Produits() {
  const {
    products,
    total,
    fetchProducts,
    exportProductsToExcel,
    importProductsFromExcel,
    addProduct,
    duplicateProduct,
  } = useProducts();

  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [familleFilter, setFamilleFilter] = useState("");
  const [actifFilter, setActifFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("famille");
  const [sortOrder, setSortOrder] = useState("asc");
  const fileRef = useRef();

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const rows = await importProductsFromExcel(file);
    for (const row of rows) {
      await addProduct({
        nom: row.nom,
        famille: row.famille,
        unite: row.unite,
        pmp: Number(row.pmp) || 0,
        stock_reel: Number(row.stock_reel) || 0,
        stock_min: Number(row.stock_min) || 0,
        actif: row.actif !== false,
        code: row.code || "",
        allergenes: row.allergenes || "",
        image: row.image || "",
      });
    }
    fetchProducts();
    e.target.value = null;
  }

  function toggleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  function renderArrow(field) {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? " ↑" : " ↓";
  }

  // Filtre et familles/unites dynamiques
  const familles = [...new Set(products.map(p => p.famille).filter(Boolean))];
  const unites = [...new Set(products.map(p => p.unite).filter(Boolean))];

  useEffect(() => {
    fetchProducts({
      search,
      famille: familleFilter,
      actif: actifFilter === "all" ? null : actifFilter === "true",
      page,
      limit: PAGE_SIZE,
      sortBy: sortField,
      order: sortOrder,
    });
  }, [fetchProducts, search, familleFilter, actifFilter, page, sortField, sortOrder]);

  return (
    <div className="p-8 max-w-7xl mx-auto" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Produits stock</h1>
      <div className="flex flex-wrap gap-2 mb-6 items-end">
        <input
          type="search"
          value={search}
          onChange={e => { setPage(1); setSearch(e.target.value); }}
          className="input"
          placeholder="Recherche nom"
        />
        <select
          className="input"
          value={familleFilter}
          onChange={e => { setPage(1); setFamilleFilter(e.target.value); }}
        >
          <option value="">Toutes familles</option>
          {familles.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          className="input"
          value={actifFilter}
          onChange={e => { setPage(1); setActifFilter(e.target.value); }}
        >
          <option value="all">Actif ou non</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
        <Button onClick={() => { setShowForm(true); setSelectedProduct(null); }}>+ Nouveau produit</Button>
        <Button onClick={exportProductsToExcel}>Export Excel</Button>
        <Button onClick={() => fileRef.current.click()}>Import Excel</Button>
        <input
          type="file"
          accept=".xlsx"
          ref={fileRef}
          onChange={handleImport}
          data-testid="import-input"
          className="hidden"
        />
      </div>
      <div className="bg-white/5 backdrop-blur-lg shadow rounded-xl overflow-x-auto">
        <table className="min-w-full table-auto text-center text-white">
          <thead>
            <tr>
              <th className="cursor-pointer" onClick={() => toggleSort("nom")}>Nom{renderArrow("nom")}</th>
              <th className="cursor-pointer" onClick={() => toggleSort("famille")}>Famille{renderArrow("famille")}</th>
              <th>Unité</th>
              <th className="cursor-pointer" onClick={() => toggleSort("pmp")}>PMP (€){renderArrow("pmp")}</th>
              <th className="cursor-pointer" onClick={() => toggleSort("stock_reel")}>Stock{renderArrow("stock_reel")}</th>
              <th className="cursor-pointer" onClick={() => toggleSort("stock_min")}>Min{renderArrow("stock_min")}</th>
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
                <td>{p.stock_min}</td>
                <td>{p.actif ? "✅" : "❌"}</td>
                <td>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedProduct(p); setShowForm(true); }}>
                    Éditer
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedProduct(p); setShowDetail(true); }}>
                    Historique prix
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicateProduct(p.id)}>
                    Dupliquer
                  </Button>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex gap-2 justify-center">
        {Array.from({ length: Math.max(1, Math.ceil(total / PAGE_SIZE)) }, (_, i) => (
          <Button
            key={i + 1}
            size="sm"
            variant={page === i + 1 ? "default" : "outline"}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </div>
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
