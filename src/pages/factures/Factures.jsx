// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFactures as useFacturesActions } from '@/hooks/useFactures';
import { useFactures as useFacturesData } from '@/hooks/data/useFactures';
import useFournisseurs from '@/hooks/data/useFournisseurs';
import { useAuth } from '@/hooks/useAuth';
import { useFacturesAutocomplete } from '@/hooks/useFacturesAutocomplete';
import FactureForm from './FactureForm.jsx';
import FactureDetail from './FactureDetail.jsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';
import useExport from '@/hooks/useExport';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import TableHeader from '@/components/ui/TableHeader';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';
import PaginationFooter from '@/components/ui/PaginationFooter';
import FactureTable from '@/components/FactureTable';
import FactureImportModal from '@/components/FactureImportModal';
import { FACTURE_STATUTS } from '@/constants/factures';
import SupplierFilter from '@/components/filters/SupplierFilter';

export default function Factures() {
  const { deleteFacture, toggleFactureActive } = useFacturesActions();
  const { data: fournisseursActifs = [] } = useFournisseurs({ actif: true });
  const { loading: authLoading, hasAccess } = useAuth();
  const { results: factureOptions, searchFactures } = useFacturesAutocomplete();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    fournisseur: null,
    statut: searchParams.get('statut') || '',
    actif: searchParams.get('actif') || '',
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const { exportData, loading: exporting } = useExport();

  const STATUTS = [{ label: 'Tous', value: '' }];
  const statutSrc = Array.isArray(FACTURE_STATUTS) ? FACTURE_STATUTS : [];
  for (const s of statutSrc) {
    if (s !== 'Archivée') {
      STATUTS.push({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s });
    }
  }
  const ACTIVITE = [
    { label: 'Toutes', value: '' },
    { label: 'Actives', value: 'true' },
    { label: 'Inactives', value: 'false' },
  ];

  const {
    data: listData,
    isFetching: listLoading,
    refetch,
  } = useFacturesData({ ...filters, page, pageSize });
  const factures = listData?.factures || [];
  const total = listData?.total || 0;

  const canEdit = hasAccess('factures', 'peut_modifier');

  useEffect(() => {
    searchFactures(filters.search || '');
  }, [filters.search, searchFactures]);
  useEffect(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (filters.statut) params.set('statut', filters.statut);
      else params.delete('statut');
      if (filters.actif) params.set('actif', filters.actif);
      else params.delete('actif');
      return params;
    });
  }, [filters.statut, filters.actif, setSearchParams]);

  const handleDelete = async (facture) => {
    if (window.confirm(`Archiver la facture n°${facture.id} ?`)) {
      setLoading(true);
      await deleteFacture(facture.id);
      await refetch();
      setLoading(false);
      toast.success('Facture archivée.');
    }
  };

  if (authLoading || loading || listLoading)
    return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 container mx-auto text-shadow space-y-6">
      {!showForm && (
        <GlassCard width="w-full">
          <TableHeader className="items-center w-full flex-wrap gap-2">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <input
                list="factures-list"
                type="search"
                value={filters.search || ''}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, search: e.target.value }));
                  setPage(1);
                }}
                placeholder="Recherche (numéro)"
                className="input input-bordered w-64"
              />
              <datalist id="factures-list">
                {(() => {
                  const items = [];
                  const opts = Array.isArray(factureOptions)
                    ? factureOptions
                    : [];
                  for (const f of opts) {
                    items.push(
                      <option key={f.id} value={f.numero || f.id}>
                        {`n°${f.numero || f.id} - ${f.fournisseur?.nom || ''}`}
                      </option>
                    );
                  }
                  return items;
                })()}
              </datalist>

              <SupplierFilter
                value={filters.fournisseur || null}
                onChange={(val) => {
                  setFilters((f) => ({ ...f, fournisseur: val }));
                  setPage(1);
                }}
              />

              <select
                value={filters.statut ?? ''}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, statut: e.target.value }));
                  setPage(1);
                }}
                className="select select-bordered h-10"
              >
                {(() => {
                  const items = [];
                  const list = Array.isArray(STATUTS) ? STATUTS : [];
                  for (const o of list) {
                    items.push(
                      <option key={o.label} value={o.value}>
                        {o.label}
                      </option>
                    );
                  }
                  return items;
                })()}
              </select>

              <select
                value={filters.actif ?? ''}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, actif: e.target.value }));
                  setPage(1);
                }}
                className="select select-bordered h-10"
              >
                {(() => {
                  const items = [];
                  const list = Array.isArray(ACTIVITE) ? ACTIVITE : [];
                  for (const o of list) {
                    items.push(
                      <option key={o.label} value={o.value}>
                        {o.label}
                      </option>
                    );
                  }
                  return items;
                })()}
              </select>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2 ml-auto">
                <div className="hidden md:flex gap-2">
                  <Button
                    onClick={() => {
                      setSelected(null);
                      setShowForm(true);
                    }}
                  >
                    Ajouter une facture
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      exportData({ type: 'factures', format: 'excel' })
                    }
                    disabled={exporting}
                  >
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
                    <DropdownMenuItem
                      onSelect={() => {
                        setSelected(null);
                        setShowForm(true);
                      }}
                    >
                      Ajouter une facture
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        exportData({ type: 'factures', format: 'excel' })
                      }
                      disabled={exporting}
                    >
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
      )}

      {showForm && (
        <FactureForm
          facture={selected}
          fournisseurs={fournisseursActifs}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
            refetch();
          }}
          onSaved={refetch}
        />
      )}

      {!showForm && (
        <>
          <FactureTable
            factures={factures}
            canEdit={canEdit}
            onEdit={(f) => {
              setSelected({ id: f.id });
              setShowForm(true);
            }}
            onDetail={(f) => {
              setSelected(f);
              setShowDetail(true);
            }}
            onToggleActive={async (id, actif) => {
              await toggleFactureActive(id, actif);
              refetch();
            }}
            onArchive={handleDelete}
          />

          <PaginationFooter
            page={page}
            pages={Math.ceil(total / pageSize)}
            onPageChange={setPage}
            className="mb-4"
          />
        </>
      )}

      {showDetail && selected && (
        <FactureDetail
          facture={selected}
          onClose={() => {
            setShowDetail(false);
            setSelected(null);
          }}
        />
      )}

      {showImport && (
        <FactureImportModal
          open={showImport}
          onClose={() => setShowImport(false)}
          onImport={() => {
            setShowImport(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
