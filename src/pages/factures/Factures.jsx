// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useFactures } from "@/hooks/useFactures";
import { useFacturesList } from "@/hooks/useFacturesList";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { useFournisseursAutocomplete } from "@/hooks/useFournisseursAutocomplete";
import { useAuth } from '@/hooks/useAuth';
import { useFacturesAutocomplete } from "@/hooks/useFacturesAutocomplete";
import FactureForm from "./FactureForm.jsx";
import FactureDetail from "./FactureDetail.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import useExport from "@/hooks/useExport";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TableHeader from "@/components/ui/TableHeader";
import GlassCard from "@/components/ui/GlassCard";
import { Toaster, toast } from "react-hot-toast";
import PaginationFooter from "@/components/ui/PaginationFooter";
import FactureTable from "@/components/FactureTable";
import FactureImportModal from "@/components/FactureImportModal";
import { FACTURE_STATUTS } from "@/constants/factures";

export default function Factures() {
  const { deleteFacture, toggleFactureActive } = useFactures();
  const { fournisseurs, getFournisseurs } = useFournisseurs();
  const { results: fournisseurOptions, searchFournisseurs } = useFournisseursAutocomplete();
  const { loading: authLoading, hasAccess } = useAuth();
  const { results: factureOptions, searchFactures } = useFacturesAutocomplete();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [fournisseurFilter, setFournisseurFilter] = useState("");
  const [fournisseurInput, setFournisseurInput] = useState("");
  const [actifFilter, setActifFilter] = useState("true");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const { exportData, loading: exporting } = useExport();

  const {
    data: listData,
    isFetching: listLoading,
    refetch,
  } = useFacturesList({
    search,
    fournisseur: fournisseurFilter,
    statut: statutFilter,
    actif: actifFilter === "all" ? null : actifFilter === "true",
    page,
    pageSize,
  });
  const factures = listData?.factures || [];
  const total = listData?.total || 0;

  const canEdit = hasAccess("factures", "peut_modifier");

  useEffect(() => { getFournisseurs(); }, [getFournisseurs]);
  useEffect(() => { searchFactures(search); }, [search, searchFactures]);
  useEffect(() => { searchFournisseurs(fournisseurInput); }, [fournisseurInput, searchFournisseurs]);

  const handleFournisseurInput = e => {
    const val = e.target.value;
    setFournisseurInput(val);
    const match = fournisseurOptions.find(f => f.nom.toLowerCase() === val.toLowerCase());
    setFournisseurFilter(match ? match.id : "");
    setPage(1);
  };

  const handleDelete = async facture => {
    if (window.confirm(`Archiver la facture n°${facture.id} ?`)) {
      setLoading(true);
      await deleteFacture(facture.id);
      await refetch();
      setLoading(false);
      toast.success("Facture archivée.");
    }
  };

  if (authLoading || loading || listLoading)
    return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 container mx-auto text-shadow space-y-6">
      <Toaster position="top-right" />
      <GlassCard width="w-full">
        <TableHeader className="items-center w-full flex-wrap gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <Input
              list="factures-list"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Recherche (numéro)"
              className="flex-1 min-w-[12rem]"
            />
            <datalist id="factures-list">
              {factureOptions.map(f => (
                <option key={f.id} value={f.numero || f.id}>
                  {`n°${f.numero || f.id} - ${f.fournisseur?.nom || ""}`}
                </option>
              ))}
            </datalist>
            <div className="w-full sm:w-auto">
              <Input
                list="fournisseurs-list"
                value={fournisseurInput}
                onChange={handleFournisseurInput}
                placeholder="Tous fournisseurs"
                className="w-full sm:w-48"
              />
              <datalist id="fournisseurs-list">
                {fournisseurOptions.map(f => (
                  <option key={f.id} value={f.nom} />
                ))}
              </datalist>
            </div>
            <Select
              value={statutFilter}
              onChange={e => { setStatutFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-40"
            >
              <option value="">Tous statuts</option>
              {FACTURE_STATUTS.map(s => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
            <Select
              value={actifFilter}
              onChange={e => { setActifFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-40"
            >
              <option value="true">Actives</option>
              <option value="false">Inactives</option>
              <option value="all">Toutes</option>
            </Select>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2 ml-auto">
              <div className="hidden md:flex gap-2">
                <Button onClick={() => { setSelected(null); setShowForm(true); }}>
                  Ajouter une facture
                </Button>
                <Button variant="outline" onClick={() => exportData({ type: 'factures', format: 'excel' })} disabled={exporting}>
                  Export Excel
                </Button>
                <Button variant="outline" onClick={() => setShowImport(true)}>
                  Importer
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="md:hidden">
                    <Menu className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => { setSelected(null); setShowForm(true); }}>
                    Ajouter une facture
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => exportData({ type: 'factures', format: 'excel' })} disabled={exporting}>
                    Export Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setShowImport(true)}>
                    Importer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </TableHeader>
      </GlassCard>

      {showForm && (
        <FactureForm
          facture={selected}
          fournisseurs={fournisseurs}
          onClose={() => { setShowForm(false); setSelected(null); refetch(); }}
          onSaved={refetch}
        />
      )}

      <FactureTable
        factures={factures}
        canEdit={canEdit}
        onEdit={f => { setSelected({ id: f.id }); setShowForm(true); }}
        onDetail={f => { setSelected(f); setShowDetail(true); }}
        onToggleActive={async (id, actif) => { await toggleFactureActive(id, actif); refetch(); }}
        onArchive={handleDelete}
      />

      <PaginationFooter
        page={page}
        pages={Math.ceil(total / pageSize)}
        onPageChange={setPage}
        className="mb-4"
      />

      {showDetail && selected && (
        <FactureDetail facture={selected} onClose={() => { setShowDetail(false); setSelected(null); }} />
      )}

      {showImport && (
        <FactureImportModal
          open={showImport}
          onClose={() => setShowImport(false)}
          onImport={() => { setShowImport(false); refetch(); }}
        />
      )}
    </div>
  );
}
