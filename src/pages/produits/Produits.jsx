// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProductsView } from "@/hooks/useProductsView";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ListingContainer from "@/components/ui/ListingContainer";
import PaginationFooter from "@/components/ui/PaginationFooter";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { fetchFamillesForValidation } from "@/hooks/useFamilles";
import { fetchSousFamilles } from "@/hooks/useSousFamilles";
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

  const {
    products: dataProducts,
    total,
    fetchProducts,
    toggleProductActive,
  } = useProductsView();
  const products = dataProducts ?? [];

  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statut, setStatut] = useState(searchParams.get("statut") || "all");
  const [familleId, setFamilleId] = useState(searchParams.get("familleId") || "all");
  const [sousFamilleId, setSousFamilleId] = useState(
    searchParams.get("sousFamilleId") || "all"
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "nom");
  const [ascending, setAscending] = useState(
    (searchParams.get("order") || "asc") === "asc"
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 25);

  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [dataFamilles, setDataFamilles] = useState([]);
  const [dataSousFamilles, setDataSousFamilles] = useState([]);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!canView) return;
    fetchProducts({
      search: debouncedSearch,
      page,
      limit,
      sortBy,
      ascending,
      statut,
      familleId,
      sousFamilleId,
    });
  }, [debouncedSearch, page, limit, sortBy, ascending, statut, familleId, sousFamilleId, fetchProducts, canView]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sortBy) params.set("sortBy", sortBy);
    params.set("order", ascending ? "asc" : "desc");
    params.set("page", page.toString());
    params.set("limit", limit.toString());
    params.set("statut", statut);
    if (familleId !== "all") params.set("familleId", familleId);
    if (sousFamilleId !== "all") params.set("sousFamilleId", sousFamilleId);
    setSearchParams(params);
  }, [search, sortBy, ascending, page, limit, statut, familleId, sousFamilleId, setSearchParams]);

  useEffect(() => {
    if (!mama_id) return;
    async function loadRefs() {
      try {
        const [fams, sous] = await Promise.all([
          fetchFamillesForValidation(supabase, mama_id),
          fetchSousFamilles({ mamaId: mama_id }),
        ]);
        setDataFamilles(fams || []);
        setDataSousFamilles(sous || []);
      } catch {
        setDataFamilles([]);
        setDataSousFamilles([]);
      }
    }
    loadRefs();
  }, [mama_id]);

  const familles = dataFamilles ?? [];
  const sousFamilles = dataSousFamilles ?? [];
  const sousFamillesFiltrees =
    familleId === 'all'
      ? sousFamilles
      : sousFamilles.filter((sf) => sf.famille_id === Number(familleId));

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
    fetchProducts({
      search: debouncedSearch,
      page,
      limit,
      sortBy,
      ascending,
      statut,
      familleId,
      sousFamilleId,
    });
  }

  if (!canView) {
    return <div className="p-8">Accès refusé</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-shadow space-y-6">
      <h1 className="text-2xl font-bold mb-4">Produits stock</h1>
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 mb-4">
        <Input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Recherche nom"
          className="flex-1 min-w-[220px]"
        />
        <select
          className="w-[160px] px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white"
          value={statut}
          onChange={(e) => {
            setPage(1);
            setStatut(e.target.value);
          }}
          aria-label="Statut"
          title="Filtrer par statut"
        >
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        <select
          className="w-[220px] px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white"
          value={familleId}
          onChange={(e) => {
            setPage(1);
            setFamilleId(e.target.value);
            setSousFamilleId('all');
          }}
          aria-label="Famille"
          title="Filtrer par famille"
        >
          <option value="all">Toutes les familles</option>
          {familles.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
        </select>
        <select
          className="w-[240px] px-4 py-2 rounded-md border border-white/20 bg-white/10 text-white disabled:opacity-50"
          value={sousFamilleId}
          onChange={(e) => {
            setPage(1);
            setSousFamilleId(e.target.value);
          }}
          aria-label="Sous-famille"
          title="Filtrer par sous-famille"
          disabled={familleId === 'all' && sousFamillesFiltrees.length === 0}
        >
          <option value="all">
            {familleId === 'all'
              ? 'Toutes les sous-familles'
              : 'Toutes'}
          </option>
          {sousFamillesFiltrees.map((sf) => (
            <option key={sf.id} value={sf.id}>
              {sf.nom}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
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
        </div>
      </div>
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
        <select
          className="w-24 px-2 py-2 rounded-md border border-white/20 bg-white/10 text-white"
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
        </select>
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
          fetchProducts({
            search: debouncedSearch,
            page,
            limit,
            sortBy,
            ascending,
            statut,
            familleId,
            sousFamilleId,
          });
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
          fetchProducts({
            search: debouncedSearch,
            page,
            limit,
            sortBy,
            ascending,
            statut,
            familleId,
            sousFamilleId,
          });
        }}
      />
    </div>
  );
}
