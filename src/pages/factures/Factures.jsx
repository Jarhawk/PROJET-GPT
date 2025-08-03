// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { useFactures } from "@/hooks/useFactures";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import useAuth from "@/hooks/useAuth";
import { useFacturesAutocomplete } from "@/hooks/useFacturesAutocomplete";
import FactureForm from "./FactureForm.jsx";
import FactureDetail from "./FactureDetail.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import useExport from "@/hooks/useExport";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TableHeader from "@/components/ui/TableHeader";
import GlassCard from "@/components/ui/GlassCard";
import { Toaster, toast } from "react-hot-toast";
import PaginationFooter from "@/components/ui/PaginationFooter";
import FactureTable from "@/components/FactureTable";
import FactureImportModal from "@/components/FactureImportModal";

const STATUTS = {
  brouillon: "badge",
  "en attente": "badge badge-user",
  validée: "badge badge-admin",
  payée: "badge badge-admin",
  refusée: "badge badge-superadmin",
  annulée: "badge badge-superadmin",
  archivée: "badge",
};

export default function Factures() {
  const { factures, total, getFactures, deleteFacture, toggleFactureActive } = useFactures();
  const { fournisseurs } = useFournisseurs();
  const { mama_id, loading: authLoading, hasAccess } = useAuth();
  const { results: factureOptions, searchFactures } = useFacturesAutocomplete();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [fournisseurFilter, setFournisseurFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [actifFilter, setActifFilter] = useState("true");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const { exportData, loading: exporting } = useExport();

  const refreshList = useCallback(() => {
    if (!mama_id) return;
    getFactures({
      search,
      fournisseur: fournisseurFilter,
      statut: statutFilter,
      mois: monthFilter,
      actif: actifFilter === "all" ? null : actifFilter === "true",
      page,
      pageSize,
    });
  }, [mama_id, getFactures, search, fournisseurFilter, statutFilter, monthFilter, actifFilter, page]);

  const canEdit = hasAccess("factures", "peut_modifier");

  useEffect(() => { searchFactures(search); }, [search, searchFactures]);
  useEffect(() => { refreshList(); }, [refreshList]);

  const handleDelete = async facture => {
    if (window.confirm(`Archiver la facture n°${facture.id} ?`)) {
      setLoading(true);
      await deleteFacture(facture.id);
      await refreshList();
      setLoading(false);
      toast.success("Facture archivée.");
    }
  };

  if (authLoading || loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 container mx-auto text-shadow space-y-6">
      <Toaster position="top-right" />
      <GlassCard width="w-full">
        <TableHeader className="items-end w-full flex-wrap">
          <div className="flex flex-wrap gap-2 flex-1">
            <Input
              list="factures-list"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Recherche (numéro)"
            />
            <datalist id="factures-list">
              {factureOptions.map(f => (
                <option key={f.id} value={f.numero || f.id}>
                  {`n°${f.numero || f.id} - ${f.fournisseur?.nom || ""}`}
                </option>
              ))}
            </datalist>
            <Select
              value={fournisseurFilter}
              onChange={e => { setFournisseurFilter(e.target.value); setPage(1); }}
            >
              <option value="">Tous fournisseurs</option>
              {fournisseurs.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </Select>
            <Select
              value={statutFilter}
              onChange={e => { setStatutFilter(e.target.value); setPage(1); }}
            >
              <option value="">Tous statuts</option>
              {Object.keys(STATUTS).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Input
              type="month"
              value={monthFilter}
              onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
            />
            <Select
              value={actifFilter}
              onChange={e => { setActifFilter(e.target.value); setPage(1); }}
            >
              <option value="true">Actives</option>
              <option value="false">Inactives</option>
              <option value="all">Toutes</option>
            </Select>
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-2">
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
          )}
        </TableHeader>
      </GlassCard>

      {showForm && (
        <FactureForm
          facture={selected}
          fournisseurs={fournisseurs}
          onClose={() => { setShowForm(false); setSelected(null); refreshList(); }}
        />
      )}

      <FactureTable
        factures={factures}
        canEdit={canEdit}
        onEdit={f => { setSelected(f); setShowForm(true); }}
        onDetail={f => { setSelected(f); setShowDetail(true); }}
        onToggleActive={async (id, actif) => { await toggleFactureActive(id, actif); refreshList(); }}
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
          onImport={() => { setShowImport(false); refreshList(); }}
        />
      )}
    </div>
  );
}
