// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProductsView } from "@/hooks/useProductsView";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import TableHeader from "@/components/ui/TableHeader";
import ListingContainer from "@/components/ui/ListingContainer";
import PaginationFooter from "@/components/ui/PaginationFooter";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import ProduitFormModal from "@/components/produits/ProduitFormModal";
import ProduitDetail from "@/components/produits/ProduitDetail";
import ProduitRow from "@/components/produits/ProduitRow";
import { Plus as PlusIcon, FileDown as FileDownIcon } from "lucide-react";
import { exportExcelProduits } from "@/utils/excelUtils";
import { toast } from "sonner";
import ModalImportProduits from "@/components/produits/ModalImportProduits";
import useDebounce from "@/hooks/useDebounce";

const LIMIT_OPTIONS = [25, 50, 100];

export default function Produits() {
  useEffect(() => {
    document.title = "Produits";
  }, []);

  const { hasAccess, mama_id } = useAuth();
  const canEdit = hasAccess("produits", "peut_modifier");
  const canView = hasAccess("produits", "peut_voir");

  const { products, total, fetchProducts, toggleProductActive } = useProductsView();

  const [searchParams, setSearchParams] = useSearchParams();

  const [term, setTerm] = useState(searchParams.get("term") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "nom");
  const [ascending, setAscending] = useState((searchParams.get("order") || "asc") === "asc");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 25);
  const [filtreActif, setFiltreActif] = useState(searchParams.get("actif") || "tous");

  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const debouncedTerm = useDebounce(term, 300);

  useEffect(() => {
    if (!canView) return;
    fetchProducts({ term: debouncedTerm, page, limit, sortBy, ascending, filtreActif });
  }, [debouncedTerm, page, limit, sortBy, ascending, filtreActif, fetchProducts, canView]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (term) params.set("term", term);
    if (sortBy) params.set("sortBy", sortBy);
    params.set("order", ascending ? "asc" : "desc");
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    params.set("actif", filtreActif);
    setSearchParams(params);
  }, [term, sortBy, ascending, page, limit, filtreActif, setSearchParams]);

  const pages = Math.max(1, Math.ceil(total / limit));

  function toggleSort(field) {
    if (sortBy === field) setAscending(!ascending);
    else {
      setSortBy(field);
      setAscending(true);
    }
  }

  function renderArrow(field) {
    if (sortBy !== field) return null;
    return ascending ? " ↑" : " ↓";
  }

  async function handleExportExcel() {
    try {
      await exportExcelProduits(mama_id);
      toast.success("Export Excel réussi");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleToggleActive(id, actif) {
    await toggleProductActive(id, actif);
    fetchProducts({ term: debouncedTerm, page, limit, sortBy, ascending, filtreActif });
  }

  if (!canView) {
    return <div className="p-8">Accès refusé</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-shadow space-y-6">
      <h1 className="text-2xl font-bold mb-4">Produits stock</h1>
      <TableHeader className="flex-wrap gap-2">
        <Input
          type="search"
          value={term}
          onChange={(e) => {
            setPage(1);
            setTerm(e.target.value);
          }}
          placeholder="Recherche nom"
          className="flex-1 min-w-[150px]"
        />
        <Select
          className="w-32"
          value={filtreActif}
          onChange={(e) => {
            setPage(1);
            setFiltreActif(e.target.value);
          }}
        >
          <option value="tous">Actif ou non</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </Select>
        <Button
          variant="primary"
          icon={PlusIcon}
          onClick={() => {
            setShowForm(true);
            setSelectedProduct(null);
          }}
        >
          Nouveau produit
        </Button>
        <Button
          icon={FileDownIcon}
          onClick={handleExportExcel}
          disabled={products.length === 0}
        >
          Exporter vers Excel
        </Button>
        <Button onClick={() => setShowImport(true)}>Importer via Excel</Button>
      </TableHeader>
      <ListingContainer className="hidden md:block">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr>
              <th
                className="px-2 text-left cursor-pointer"
                onClick={() => toggleSort("nom")}
              >
                Nom{renderArrow("nom")}
              </th>
              <th className="px-2 text-center">Unité</th>
              <th
                className="px-2 text-right cursor-pointer"
                onClick={() => toggleSort("pmp")}
              >
                PMP (€){renderArrow("pmp")}
              </th>
              <th
                className="px-2 text-right cursor-pointer"
                onClick={() => toggleSort("stock_theorique")}
              >
                Stock théorique{renderArrow("stock_theorique")}
              </th>
              <th
                className="px-2 text-left cursor-pointer"
                onClick={() => toggleSort("zone")}
              >
                Zone de stockage{renderArrow("zone")}
              </th>
              <th className="px-2 text-center min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-muted-foreground">
                  Aucun produit trouvé. Essayez d’ajouter un produit via le bouton ci-dessus.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <ProduitRow
                  key={p.id}
                  produit={p}
                  onDetail={(prod) => {
                    setSelectedProduct(prod);
                    setShowDetail(true);
                  }}
                  onEdit={(prod) => {
                    setSelectedProduct(prod);
                    setShowForm(true);
                  }}
                  onToggleActive={handleToggleActive}
                  canEdit={canEdit}
                />
              ))
            )}
          </tbody>
        </table>
      </ListingContainer>
      {/* Mobile listing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:hidden">
        {products.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            Aucun produit trouvé. Essayez d’ajouter un produit via le bouton ci-dessus.
          </div>
        ) : (
          products.map((produit) => (
            <div key={produit.id} className="p-4 border rounded">
              <div className="flex justify-between items-start">
                <div className="font-bold break-words">{produit.nom}</div>
                <span>{produit.actif ? "✅" : "❌"}</span>
              </div>
              <div className="text-sm mt-1 flex flex-wrap gap-2">
                <span>{produit.unite?.nom ?? ""}</span>
                <span>Stock: {produit.stock_theorique}</span>
                <span>PMP: {produit.pmp != null ? Number(produit.pmp).toFixed(2) : "-"}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => {
                    setSelectedProduct(produit);
                    setShowDetail(true);
                  }}
                >
                  Voir
                </Button>
                {canEdit && (
                  <>
                    <Button
                      onClick={() => {
                        setSelectedProduct(produit);
                        setShowForm(true);
                      }}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleToggleActive(produit.id, !produit.actif)}
                    >
                      {produit.actif ? "Désactiver" : "Activer"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
        <span className="text-sm">Total : {total}</span>
        <Select
          className="w-24"
          value={limit}
          onChange={(e) => {
            setPage(1);
            setLimit(Number(e.target.value));
          }}
        >
          {LIMIT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}/page
            </option>
          ))}
        </Select>
      </div>
      <PaginationFooter page={page} pages={pages} onPageChange={setPage} />
      <ProduitFormModal
        open={showForm}
        produit={selectedProduct}
        onClose={() => {
          setShowForm(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          fetchProducts({ term: debouncedTerm, page, limit, sortBy, ascending, filtreActif });
        }}
      />
      <ProduitDetail
        produitId={selectedProduct?.id}
        open={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedProduct(null);
        }}
      />
      <ModalImportProduits
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => {
          setShowImport(false);
          fetchProducts({ term: debouncedTerm, page, limit, sortBy, ascending, filtreActif });
        }}
      />
    </div>
  );
}
