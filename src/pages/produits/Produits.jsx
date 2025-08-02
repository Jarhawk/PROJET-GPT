// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useRef, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useFamilles } from "@/hooks/useFamilles";
import useZonesStock from "@/hooks/useZonesStock";
import ProduitFormModal from "@/components/produits/ProduitFormModal";
import ProduitDetail from "@/components/produits/ProduitDetail";
import { Button } from "@/components/ui/button";
import ListingContainer from "@/components/ui/ListingContainer";
import PaginationFooter from "@/components/ui/PaginationFooter";
import TableHeader from "@/components/ui/TableHeader";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus as PlusIcon } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import ProduitRow from "@/components/produits/ProduitRow";
import {
  parseProduitsFile,
  insertProduits,
} from "@/utils/importExcelProduits";

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
    duplicateProduct,
    toggleProductActive,
  } = useProducts();
  const { familles: famillesHook, fetchFamilles } = useFamilles();
  const { zones } = useZonesStock();
  const familles = famillesHook;

  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [sousFamilleFilter, setSousFamilleFilter] = useState("");
  const [actifFilter, setActifFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("zone_stock");
  const [sortOrder, setSortOrder] = useState("asc");
  const fileRef = useRef(null);
  const { hasAccess, mama_id } = useAuth();
  const canEdit = hasAccess("produits", "peut_modifier");
  const [importRows, setImportRows] = useState([]);
  const [importing, setImporting] = useState(false);

  const refreshList = useCallback(() => {
    fetchProducts({
      search,
      sousFamille: sousFamilleFilter,
      actif: actifFilter === "all" ? null : actifFilter === "true",
      page,
      limit: PAGE_SIZE,
      sortBy: sortField,
      order: sortOrder,
    });
  }, [
    fetchProducts,
    search,
    sousFamilleFilter,
    actifFilter,
    page,
    sortField,
    sortOrder,
  ]);

  // Load dropdown data once on mount
  useEffect(() => {
    fetchFamilles();
  }, [fetchFamilles]);

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const rows = await parseProduitsFile(file, mama_id);
    setImportRows(rows);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleConfirmImport() {
    const validRows = importRows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) return;
    setImporting(true);
    const results = await insertProduits(validRows);
    const failed = results.filter((r) => r.insertError);
    const successCount = results.length - failed.length;
    if (successCount)
      toast.success(`${successCount} produits importés`);
    if (failed.length)
      toast.error(`${failed.length} erreurs d'insertion`);
    const invalid = importRows.filter((r) => r.errors.length > 0);
    setImportRows([...invalid, ...failed]);
    setImporting(false);
    refreshList();
  }

  const validCount = importRows.filter((r) => r.errors.length === 0).length;
  const invalidCount = importRows.length - validCount;

  const filteredProducts = products.filter((p) => {
    if (zoneFilter && p.zone_stock_id !== zoneFilter) return false;
    return true;
  });

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
      <div className="w-full md:w-4/5 mx-auto space-y-4">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-4 p-4 rounded-xl bg-muted/30 backdrop-blur">
          <Input
            type="search"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="flex-1 min-w-[150px]"
            placeholder="Recherche nom"
            ariaLabel="Recherche nom"
          />
          <Select
            className="flex-1 min-w-[150px]"
            value={sousFamilleFilter}
            onChange={(e) => {
              setPage(1);
              setSousFamilleFilter(e.target.value);
            }}
            ariaLabel="Filtrer par famille"
          >
            <option value="">Toutes familles</option>
            {familles
              .filter((f) => f.famille_parent_id)
              .map((f) => {
                const parent = familles.find(
                  (p) => p.id === f.famille_parent_id,
                );
                const label = parent
                  ? `${parent.nom} > ${f.nom}`
                  : f.nom;
                return (
                  <option key={f.id} value={f.id}>
                    {label}
                  </option>
                );
              })}
          </Select>
          <Select
            className="flex-1 min-w-[150px]"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            ariaLabel="Filtrer par zone"
          >
            <option value="">Toutes les zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nom}
              </option>
            ))}
          </Select>
          <Select
            className="flex-1 min-w-[150px]"
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
        <TableHeader className="justify-between">
          <Button
            variant="primary"
            icon={PlusIcon}
            className="btn btn-primary !px-6 !py-3 rounded-xl"
            onClick={() => {
              setShowForm(true);
              setSelectedProduct(null);
            }}
          >
            Nouveau produit
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Button className="min-w-[140px]" onClick={exportProductsToExcel}>
              Export Excel
            </Button>
            <Button
              className="min-w-[140px]"
              onClick={() => fileRef.current.click()}
            >
              Import Excel
            </Button>
            <input
              type="file"
              accept=".xlsx,.csv"
              ref={fileRef}
              onChange={handleImport}
              data-testid="import-input"
              className="hidden"
            />
          </div>
        </TableHeader>
      </div>
      {importRows.length > 0 && (
        <div className="w-full md:w-4/5 mx-auto space-y-2">
          <h2 className="text-lg font-semibold">Prévisualisation import</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Famille</th>
                  <th>Unité</th>
                  <th>Actif</th>
                  <th>PMP</th>
                  <th>Stock théorique</th>
                  <th>Stock min</th>
                  <th>Dernier prix</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {importRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.nom}</td>
                    <td>{row.famille}</td>
                    <td>{row.unite}</td>
                    <td>{row.actif ? "Oui" : "Non"}</td>
                    <td className="text-right">{row.pmp}</td>
                    <td className="text-right">{row.stock_theorique}</td>
                    <td className="text-right">{row.stock_min}</td>
                    <td className="text-right">{row.dernier_prix}</td>
                    <td>
                      {row.errors.length
                        ? `❌ ${row.errors.join(", ")}`
                        : row.insertError
                          ? `❌ ${row.insertError}`
                          : "✅ OK"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center">
            <div>
              {validCount} lignes valides
              <br />
              {invalidCount} lignes invalides
            </div>
            <Button
              className="min-w-[200px]"
              onClick={handleConfirmImport}
              disabled={importing || validCount === 0}
            >
              Confirmer l’importation
            </Button>
          </div>
        </div>
      )}
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
              <th
                className="cursor-pointer"
                onClick={() => toggleSort("zone_stock")}
              >
                Zone{renderArrow("zone_stock")}
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
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-4 text-center text-muted-foreground">
                  Aucun produit trouvé. Essayez d’ajouter un produit via le bouton ci-dessus.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
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
