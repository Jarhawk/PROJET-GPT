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
import { Card } from "@/components/ui/card";
import { Plus as PlusIcon } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import ProduitRow from "@/components/produits/ProduitRow";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 50;

export default function Produits() {
  useEffect(() => {
    document.title = "Produits";
  }, []);
  const {
    products,
    total,
    fetchProducts,
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
  const [sortField, setSortField] = useState("famille");
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
    sousFamilleFilter,
    zoneFilter,
    actifFilter,
    page,
    sortField,
    sortOrder,
  ]);

  // Load dropdown data once on mount
  useEffect(() => {
    fetchFamilles();
  }, [fetchFamilles]);

  function parseBoolean(value) {
    if (typeof value === "boolean") return value;
    const str = String(value).toLowerCase().trim();
    if (["true", "vrai", "1", "yes", "oui"].includes(str)) return true;
    if (["false", "faux", "0", "no", "non"].includes(str)) return false;
    return false;
  }

  async function handleImportExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const [famillesData, sousFamillesData, unitesData, zonesData, fournisseursData] =
      await Promise.all([
        supabase.from("familles").select("id, nom").eq("mama_id", mama_id),
        supabase.from("sous_familles").select("id, nom").eq("mama_id", mama_id),
        supabase.from("unites").select("id, nom").eq("mama_id", mama_id),
        supabase.from("zones_stock").select("id, nom").eq("mama_id", mama_id),
        supabase.from("fournisseurs").select("id, nom").eq("mama_id", mama_id),
      ]);

    const mapByName = (arr) =>
      new Map((arr.data || []).map((f) => [f.nom.toLowerCase(), f.id]));
    const famillesMap = mapByName(famillesData);
    const sousFamillesMap = mapByName(sousFamillesData);
    const unitesMap = mapByName(unitesData);
    const zonesMap = mapByName(zonesData);
    const fournisseursMap = mapByName(fournisseursData);

    const rows = raw.map((r) => {
      const n = Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k.toLowerCase().trim(), v]),
      );
      const stockMin = n.stock_minimum !== "" ? Number(n.stock_minimum) : null;
      const row = {
        nom: String(n.nom || "").trim(),
        famille_nom: String(n.famille || "").trim(),
        sous_famille_nom: String(n.sous_famille || "").trim(),
        unite_nom: String(n.unite || "").trim(),
        zone_nom: String(n.zone_stockage || "").trim(),
        actif: parseBoolean(n.actif),
        stock_minimum: stockMin,
        pmp: n.pmp !== "" ? Number(n.pmp) : null,
        dernier_prix: n.dernier_prix !== "" ? Number(n.dernier_prix) : null,
        fournisseur_nom: String(n.fournisseur_principal || "").trim(),
        famille_id: null,
        sous_famille_id: null,
        unite_id: null,
        zone_stock_id: null,
        fournisseur_id: null,
        seuil_min: stockMin,
        mama_id,
        errors: [],
      };

      if (!row.nom) row.errors.push("nom manquant");

      row.unite_id = unitesMap.get(row.unite_nom.toLowerCase());
      if (!row.unite_id) row.errors.push("unite inconnue");

      row.famille_id = famillesMap.get(row.famille_nom.toLowerCase());
      if (!row.famille_id) row.errors.push("famille inconnue");

      row.sous_famille_id = sousFamillesMap.get(row.sous_famille_nom.toLowerCase());
      if (!row.sous_famille_id) row.errors.push("sous_famille inconnue");

      row.zone_stock_id = zonesMap.get(row.zone_nom.toLowerCase());
      if (!row.zone_stock_id) row.errors.push("zone_stockage inconnue");

      if (row.fournisseur_nom) {
        row.fournisseur_id = fournisseursMap.get(
          row.fournisseur_nom.toLowerCase(),
        );
        if (!row.fournisseur_id)
          row.errors.push("fournisseur_principal inconnu");
      }

      return row;
    });

    setImportRows(rows);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleConfirmImport() {
    const validRows = importRows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) return;
    setImporting(true);

    const results = [];
    for (const row of validRows) {
      const {
        errors: _e,
        famille_nom: _familleNom,
        sous_famille_nom: _sousFamilleNom,
        unite_nom: _uniteNom,
        zone_nom: _zoneNom,
        fournisseur_nom: _fournisseurNom,
        ...payload
      } = row;
      delete payload.stock_minimum;
      try {
        const { error } = await supabase.from("produits").insert([payload]);
        if (error) results.push({ ...row, insertError: error.message });
        else results.push({ ...row, insertError: null });
      } catch (err) {
        results.push({ ...row, insertError: err.message });
      }
    }

    const failed = results.filter((r) => r.insertError);
    const successCount = results.length - failed.length;
    if (successCount) toast.success(`${successCount} produits importés`);
    if (failed.length) toast.error(`${failed.length} erreurs d'insertion`);

    const invalid = importRows.filter((r) => r.errors.length > 0);
    setImportRows([...invalid, ...failed]);
    setImporting(false);
    refreshList();
  }

  async function handleExportExcel() {
    const { data, error } = await supabase
      .from("produits")
      .select(
        `nom, famille:familles(nom), sous_famille:sous_familles(nom), unite:unites(nom), zone:zones_stock(nom), actif, seuil_min, pmp, dernier_prix, fournisseur_principal:fournisseur_id(nom)`
      )
      .eq("mama_id", mama_id);
    if (error) {
      toast.error(error.message);
      return;
    }
    const rows = (data || []).map((p) => ({
      nom: p.nom,
      famille: p.famille?.nom || "",
      sous_famille: p.sous_famille?.nom || "",
      unite: p.unite?.nom || "",
      zone_stockage: p.zone?.nom || "",
      actif: p.actif ? "TRUE" : "FALSE",
      stock_minimum: p.seuil_min ?? null,
      pmp: p.pmp ?? null,
      dernier_prix: p.dernier_prix ?? null,
      fournisseur_principal: p.fournisseur_principal?.nom || "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Produits");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "produits_export_mamastock.xlsx");
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
                const label = parent ? `${parent.nom} > ${f.nom}` : f.nom;
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
            <Button className="min-w-[140px]" onClick={handleExportExcel}>
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
              accept=".xlsx"
              ref={fileRef}
              onChange={handleImportExcel}
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
                  <th>Sous-famille</th>
                  <th>Unité</th>
                  <th>Zone de stockage</th>
                  <th>Actif</th>
                  <th>Stock min</th>
                  <th>PMP</th>
                  <th>Dernier prix</th>
                  <th>Fournisseur principal</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {importRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.nom}</td>
                    <td>{row.famille_nom}</td>
                    <td>{row.sous_famille_nom}</td>
                    <td>{row.unite_nom}</td>
                    <td>{row.zone_nom}</td>
                    <td>{row.actif ? "Oui" : "Non"}</td>
                    <td className="text-right">{row.stock_minimum ?? ""}</td>
                    <td className="text-right">{row.pmp ?? ""}</td>
                    <td className="text-right">{row.dernier_prix ?? ""}</td>
                    <td>{row.fournisseur_nom}</td>
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
      <ListingContainer className="hidden md:block">
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr>
              <th
                className="px-2 text-left cursor-pointer min-w-[30ch]"
                onClick={() => toggleSort("nom")}
              >
                Nom{renderArrow("nom")}
              </th>
              <th
                className="px-2 text-left cursor-pointer"
                onClick={() => toggleSort("famille")}
              >
                Famille{renderArrow("famille")}
              </th>
              <th
                className="px-2 text-left cursor-pointer"
                onClick={() => toggleSort("zone_stock")}
              >
                Zone de stockage{renderArrow("zone_stock")}
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
                className="px-2 text-right cursor-pointer"
                onClick={() => toggleSort("seuil_min")}
              >
                Min{renderArrow("seuil_min")}
              </th>
              <th className="px-2 text-left">Fournisseur</th>
              <th
                className="px-2 text-right cursor-pointer"
                onClick={() => toggleSort("dernier_prix")}
              >
                Dernier prix (€){renderArrow("dernier_prix")}
              </th>
              <th className="px-2 text-center">Actif</th>
              <th className="px-2 text-center min-w-[100px]">Actions</th>
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
      {/* Mobile listing */}
      <div className="block md:hidden space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            Aucun produit trouvé. Essayez d’ajouter un produit via le bouton ci-dessus.
          </div>
        ) : (
          filteredProducts.map((produit) => (
            <Card key={produit.id} className="p-4">
              <div className="font-bold">{produit.nom}</div>
              <div className="text-sm">
                Unité : {produit.unite?.nom ?? produit.unite ?? "-"}
              </div>
              <div className="text-sm">
                PMP : {produit.pmp != null ? Number(produit.pmp).toFixed(2) : "0.00"} €
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
                  <Button
                    onClick={() => {
                      setSelectedProduct(produit);
                      setShowForm(true);
                    }}
                  >
                    Éditer
                  </Button>
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
    </div>
  );
}
