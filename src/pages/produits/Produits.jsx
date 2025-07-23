// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/pages/Produits.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useFamilles } from "@/hooks/useFamilles";
import { useUnites } from "@/hooks/useUnites";
import ProduitFormModal from "@/components/produits/ProduitFormModal";
import ProduitDetail from "@/components/produits/ProduitDetail";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Toaster, toast } from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import ProduitRow from "@/components/produits/ProduitRow";

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
    deleteProduct,
  } = useProducts();
  const { familles: famillesHook, fetchFamilles } = useFamilles();
  const { unites: unitesHook, fetchUnites } = useUnites();

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
  const { hasAccess } = useAuth();
  const canEdit = hasAccess("produits", "peut_modifier");

  const refreshList = useCallback(() => {
    fetchProducts({
      search,
      famille: familleFilter,
      actif: actifFilter === "all" ? null : actifFilter === "true",
      page,
      limit: PAGE_SIZE,
      sortBy: sortField,
      order: sortOrder,
    });
  }, [
    fetchProducts,
    search,
    familleFilter,
    actifFilter,
    page,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    fetchFamilles();
    fetchUnites();
  }, [fetchFamilles, fetchUnites]);

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const rows = await importProductsFromExcel(file);
    const famMap = Object.fromEntries(
      familles.map((f) => [f.nom.toLowerCase(), f.id]),
    );
    const uniteMap = Object.fromEntries(
      unites.map((u) => [u.nom.toLowerCase(), u.id]),
    );
    for (const row of rows) {
      await addProduct(
        {
          nom: row.nom,
          famille_id: famMap[row.famille?.toLowerCase()] || null,
          unite_id: uniteMap[row.unite?.toLowerCase()] || null,
          stock_reel: Number(row.stock_reel) || 0,
          stock_min: Number(row.stock_min) || 0,
          actif: row.actif !== false,
          code: row.code || "",
          allergenes: row.allergenes || "",
          image: row.image || "",
        },
        { refresh: false },
      );
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

  async function handleDelete(id) {
    if (!window.confirm("Désactiver ce produit ?")) return;
    await deleteProduct(id);
    toast.success("Produit désactivé");
    refreshList();
  }

  // Filtre et familles/unites dynamiques
  const familles = famillesHook;
  const unites = unitesHook;

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  return (
    <div className="p-8 max-w-7xl mx-auto text-shadow">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Produits stock</h1>
      <div className="flex flex-wrap gap-2 mb-6 items-end">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="input"
          placeholder="Recherche nom"
        />
        <select
          className="input"
          value={familleFilter}
          onChange={(e) => {
            setPage(1);
            setFamilleFilter(e.target.value);
          }}
        >
          <option value="">Toutes familles</option>
          {familles.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={actifFilter}
          onChange={(e) => {
            setPage(1);
            setActifFilter(e.target.value);
          }}
        >
          <option value="all">Actif ou non</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
        <Button
          onClick={() => {
            setShowForm(true);
            setSelectedProduct(null);
          }}
        >
          + Nouveau produit
        </Button>
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
      <TableContainer>
        <table className="min-w-full table-auto text-center text-white">
          <thead>
            <tr>
              <th className="cursor-pointer" onClick={() => toggleSort("nom")}>
                Nom{renderArrow("nom")}
              </th>
              <th
                className="cursor-pointer"
                onClick={() => toggleSort("famille")}
              >
                Famille{renderArrow("famille")}
              </th>
              <th>Unité</th>
              <th className="cursor-pointer" onClick={() => toggleSort("pmp")}>
                PMP (€){renderArrow("pmp")}
              </th>
              <th
                className="cursor-pointer"
                onClick={() => toggleSort("stock_theorique")}
              >
                Stock théorique{renderArrow("stock_theorique")}
              </th>
              <th
                className="cursor-pointer"
                onClick={() => toggleSort("stock_min")}
              >
                Min{renderArrow("stock_min")}
              </th>
              <th>Fournisseur</th>
              <th
                className="cursor-pointer"
                onClick={() => toggleSort("dernier_prix")}
              >
                Dernier prix (€){renderArrow("dernier_prix")}
              </th>
              <th>Actif</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-4 text-muted-foreground">
                  Aucun produit trouvé
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <ProduitRow
                  key={p.id}
                  produit={p}
                  onEdit={(prod) => {
                    setSelectedProduct(prod);
                    setShowForm(true);
                  }}
                  onDetail={(prod) => {
                    setSelectedProduct(prod);
                    setShowDetail(true);
                  }}
                  onDuplicate={duplicateProduct}
                  onDelete={handleDelete}
                  canEdit={canEdit}
                />
              ))
            )}
          </tbody>
        </table>
        <div className="mt-4 flex gap-2 justify-center">
          {Array.from(
            { length: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
            (_, i) => (
              <Button
                key={i + 1}
                size="sm"
                variant={page === i + 1 ? "default" : "outline"}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ),
          )}
        </div>
      </TableContainer>
      {/* Modale création/édition */}
      <ProduitFormModal
        open={showForm}
        produit={selectedProduct}
        familles={familles}
        unites={unites}
        onClose={() => {
          setShowForm(false);
          setSelectedProduct(null);
          refreshList();
        }}
        onSuccess={() => {
          refreshList();
        }}
      />
      {/* Modale détail historique */}
      <ProduitDetail
        produitId={selectedProduct?.id}
        open={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
}
