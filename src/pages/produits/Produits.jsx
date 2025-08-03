// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useFamilles } from "@/hooks/useFamilles";
import { useSousFamilles } from "@/hooks/useSousFamilles";
import useZonesStock from "@/hooks/useZonesStock";
import ProduitFormModal from "@/components/produits/ProduitFormModal";
import ProduitDetail from "@/components/produits/ProduitDetail";
import { Button } from "@/components/ui/button";
import ListingContainer from "@/components/ui/ListingContainer";
import PaginationFooter from "@/components/ui/PaginationFooter";
import TableHeader from "@/components/ui/TableHeader";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus as PlusIcon, FileDown as FileDownIcon } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import ProduitRow from "@/components/produits/ProduitRow";
import { exportExcelProduits } from "@/utils/excelUtils";
import ModalImportProduits from "@/components/produits/ModalImportProduits";

const PAGE_SIZE = 50;

export default function Produits() {
  useEffect(() => {
    document.title = "Produits";
  }, []);
  const {
    products,
    total,
    fetchProducts,
    toggleProductActive,
  } = useProducts();
  const { familles: famillesHook, fetchFamilles } = useFamilles();
  const { sousFamilles, fetchSousFamilles, setSousFamilles } =
    useSousFamilles();
  const { zones } = useZonesStock();
  const familles = famillesHook;

  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [familleFilter, setFamilleFilter] = useState("");
  const [sousFamilleFilter, setSousFamilleFilter] = useState("");
  const [actifFilter, setActifFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("famille");
  const [sortOrder, setSortOrder] = useState("asc");
  const { hasAccess, mama_id } = useAuth();
  const canEdit = hasAccess("produits", "peut_modifier");
  const canView = hasAccess("produits", "peut_voir");
  const [showImport, setShowImport] = useState(false);

  const refreshList = useCallback(() => {
    fetchProducts({
      search,
      famille: familleFilter,
      sousFamille: sousFamilleFilter,
      zone: zoneFilter,
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
    sousFamilleFilter,
    zoneFilter,
    actifFilter,
    page,
    sortField,
    sortOrder,
  ]);

  // Load dropdown data once on mount
  useEffect(() => {
    if (canView) fetchFamilles();
  }, [fetchFamilles, canView]);

  async function handleExportExcel() {
    try {
      await exportExcelProduits(mama_id);
      toast.success("Export Excel réussi");
    } catch (e) {
      toast.error(e.message);
    }
  }

  useEffect(() => {
    if (!canView) return;
    setSousFamilleFilter("");
    if (familleFilter) {
      fetchSousFamilles(familleFilter);
    } else {
      setSousFamilles([]);
    }
  }, [familleFilter, fetchSousFamilles, setSousFamilles, canView]);

  function resetFilters() {
    setSearch("");
    setFamilleFilter("");
    setSousFamilleFilter("");
    setZoneFilter("");
    setActifFilter("all");
    setPage(1);
    setSousFamilles([]);
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

  function handleEdit(prod) {
    setSelectedProduct(prod);
    setShowForm(true);
  }

  useEffect(() => {
    if (canView) refreshList();
  }, [refreshList, canView]);

  if (!canView) {
    return <div className="p-8">Accès refusé</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-shadow space-y-6">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Produits stock</h1>
      <div className="w-full md:w-4/5 mx-auto space-y-4">
        <div className="flex flex-col md:flex-row flex-wrap items-center gap-2 p-4 rounded-xl bg-muted/30 backdrop-blur">
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
            value={familleFilter}
            onChange={(e) => {
              setPage(1);
              setFamilleFilter(e.target.value);
            }}
            ariaLabel="Filtrer par famille"
          >
            <option value="">Toutes les familles</option>
            {familles.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </Select>
          <Select
            className="flex-1 min-w-[150px]"
            value={sousFamilleFilter}
            onChange={(e) => {
              setPage(1);
              setSousFamilleFilter(e.target.value);
            }}
            disabled={!familleFilter}
            ariaLabel="Filtrer par sous-famille"
          >
            <option value="">Toutes les sous-familles</option>
            {sousFamilles.map((sf) => (
              <option key={sf.id} value={sf.id}>
                {sf.nom}
              </option>
            ))}
          </Select>
          <Select
            className="flex-1 min-w-[150px]"
            value={zoneFilter}
            onChange={(e) => {
              setPage(1);
              setZoneFilter(e.target.value);
            }}
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
          <Button variant="outline" onClick={resetFilters} className="min-w-[140px]">
            Réinitialiser
          </Button>
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
            <Button
              className="min-w-[140px]"
              onClick={handleExportExcel}
              icon={FileDownIcon}
              disabled={products.length === 0}
            >
              Exporter vers Excel
            </Button>
            <Button
              className="min-w-[140px]"
              onClick={() => setShowImport(true)}
            >
              Importer via Excel
            </Button>
          </div>
        </TableHeader>
      </div>
      <ListingContainer className="hidden md:block">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr>
              <th
                className="px-2 text-left cursor-pointer min-w-[30ch]"
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
                onClick={() => toggleSort("zone_stock")}
              >
                Zone de stockage{renderArrow("zone_stock")}
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
                  onEdit={handleEdit}
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
            <Card key={produit.id} className="p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="font-bold break-words">{produit.nom}</div>
                <span>{produit.actif ? "✅" : "❌"}</span>
              </div>
              <div className="text-sm mt-1 flex flex-wrap gap-2">
                <span>{produit.unite?.nom ?? produit.unite ?? ""}</span>
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
                    <Button onClick={() => handleEdit(produit)}>Modifier</Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleToggleActive(produit.id, !produit.actif)
                      }
                    >
                      {produit.actif ? "Désactiver" : "Activer"}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
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
      <ModalImportProduits
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => {
          setShowImport(false);
          refreshList();
        }}
      />
    </div>
  );
}
