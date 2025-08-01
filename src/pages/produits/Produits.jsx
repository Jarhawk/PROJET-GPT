// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useRef, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useFamilles } from "@/hooks/useFamilles";
import { useUnites } from "@/hooks/useUnites";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import ProduitFormModal from "@/components/produits/ProduitFormModal";
import ProduitDetail from "@/components/produits/ProduitDetail";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import ListingContainer from "@/components/ui/ListingContainer";
import PaginationFooter from "@/components/ui/PaginationFooter";
import TableHeader from "@/components/ui/TableHeader";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import ProduitRow from "@/components/produits/ProduitRow";

const PAGE_SIZE = 50;

export default function Produits() {
  useEffect(() => {
    document.title = "Produits";
  }, []);
  const {
    products,
    total,
    fetchProducts,
    exportProductsToExcel,
    importProductsFromExcel,
    addProduct,
    duplicateProduct,
    toggleProductActive,
  } = useProducts();
  const { familles: famillesHook, fetchFamilles } = useFamilles();
  const { unites: unitesHook, fetchUnites } = useUnites();
  const { fournisseurs, fetchFournisseurs } = useFournisseurs();
  const familles = famillesHook;
  const unites = unitesHook;
  const fournisseursList = fournisseurs;

  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [familleFilter, setFamilleFilter] = useState("");
  const [actifFilter, setActifFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("famille");
  const [sortOrder, setSortOrder] = useState("asc");
  const fileRef = useRef(null);
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

  // Load dropdown data once on mount
  useEffect(() => {
    fetchFamilles();
    fetchUnites();
    fetchFournisseurs();
  }, [fetchFamilles, fetchUnites, fetchFournisseurs]);

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const rows = await importProductsFromExcel(file);
    const famMap = Object.fromEntries(
      familles.map((f) => [f.nom.toLowerCase().trim(), f.id]),
    );
    const uniteMap = Object.fromEntries(
      unites.map((u) => [u.nom.toLowerCase().trim(), u.id]),
    );
    const fournisseurMap = Object.fromEntries(
      fournisseursList.map((f) => [f.nom.toLowerCase().trim(), f.id])
    );
    for (const row of rows) {
      await addProduct(
        {
          nom: row.nom,
          famille_id: famMap[row.famille?.toLowerCase().trim()] || null,
          unite_id: uniteMap[row.unite?.toLowerCase().trim()] || null,
          fournisseur_id:
            fournisseurMap[row.fournisseur?.toLowerCase().trim()] || null,
          stock_reel: Number(row.stock_reel) || 0,
          stock_min: Number(row.stock_min) || 0,
          actif: row.actif !== false,
          code: row.code || "",
          allergenes: row.allergenes || "",
        },
        { refresh: false },
      );
    }
    // refresh list with current filters after batch import
    refreshList();
    toast.success(`${rows.length} produits importés`);
    if (fileRef.current) fileRef.current.value = "";
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

  async function handleToggleActive(id, actif) {
    await toggleProductActive(id, actif);
    toast.success(actif ? "Produit activé" : "Produit désactivé");
    refreshList();
  }
  useEffect(() => {
    refreshList();
  }, [refreshList]);

  return (
    <div className="p-8 max-w-7xl mx-auto text-shadow space-y-6">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Produits stock</h1>
      <GlassCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            type="search"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="max-w-[300px]"
            placeholder="Recherche nom"
            ariaLabel="Recherche nom"
          />
          <Select
            className="max-w-[300px]"
            value={familleFilter}
            onChange={(e) => {
              setPage(1);
              setFamilleFilter(e.target.value);
            }}
            ariaLabel="Filtrer par famille"
          >
            <option value="">Toutes familles</option>
            {familles.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </Select>
          <Select
            className="max-w-[300px]"
            value={actifFilter}
            onChange={(e) => {
              setPage(1);
              setActifFilter(e.target.value);
            }}
            ariaLabel="Filtrer par statut"
          >
            <option value="all">Actif ou non</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </Select>
        </div>
        <TableHeader className="mt-4">
          <Button
            className="w-auto"
            onClick={() => {
              setShowForm(true);
              setSelectedProduct(null);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Nouveau produit
          </Button>
          <Button className="w-auto" onClick={exportProductsToExcel}>
            Export Excel
          </Button>
          <Button className="w-auto" onClick={() => fileRef.current.click()}>
            Import Excel
          </Button>
          <input
            type="file"
            accept=".xlsx"
            ref={fileRef}
            onChange={handleImport}
            data-testid="import-input"
            className="hidden"
          />
        </TableHeader>
      </GlassCard>
      <ListingContainer>
        <table className="min-w-full table-auto text-sm">
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
              <th className="cursor-pointer text-right" onClick={() => toggleSort("pmp")}>
                PMP (€){renderArrow("pmp")}
              </th>
              <th
                className="cursor-pointer text-right"
                onClick={() => toggleSort("stock_theorique")}
              >
                Stock théorique{renderArrow("stock_theorique")}
              </th>
              <th
                className="cursor-pointer text-right"
                onClick={() => toggleSort("stock_min")}
              >
                Min{renderArrow("stock_min")}
              </th>
              <th>Fournisseur</th>
              <th
                className="cursor-pointer text-right"
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
                <td colSpan={10} className="py-4 text-center text-muted-foreground">
                  Aucun produit trouvé. Essayez d’ajouter un produit via le bouton ci-dessus.
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
                  onToggleActive={handleToggleActive}
                  canEdit={canEdit}
                />
              ))
            )}
          </tbody>
        </table>
      </ListingContainer>
      <PaginationFooter
        page={page}
        pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        onPageChange={setPage}
      />
      {/* Modale création/édition */}
      <ProduitFormModal
        open={showForm}
        produit={selectedProduct}
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
