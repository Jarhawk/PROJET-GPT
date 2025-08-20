// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFactures } from '@/hooks/useFactures';
import { useFacturesList } from '@/hooks/useFacturesList';
import useFournisseurs from '@/hooks/data/useFournisseurs';
import { useFournisseursAutocomplete } from '@/hooks/useFournisseursAutocomplete';
import { useAuth } from '@/hooks/useAuth';
import { useFacturesAutocomplete } from '@/hooks/useFacturesAutocomplete';
import FactureForm from './FactureForm.jsx';
import FactureDetail from './FactureDetail.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function Factures() {
  const { deleteFacture, toggleFactureActive } = useFactures();
  const { data: fournisseursActifs = [] } = useFournisseurs({ actif: true });
  const [qF, setQF] = useState('');
  const { data: fournisseurs = [], isLoading: isLoadingF } =
    useFournisseursAutocomplete(qF);
  const { loading: authLoading, hasAccess } = useAuth();
  const { results: factureOptions, searchFactures } = useFacturesAutocomplete();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState(
    searchParams.get('statut') || ''
  );
  const [fournisseurFilter, setFournisseurFilter] = useState('');
  const [actifFilter, setActifFilter] = useState(
    searchParams.get('actif') || 'true'
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const { exportData, loading: exporting } = useExport();
  const STATUT_OPTIONS = [
    '',
    ...FACTURE_STATUTS.filter((s) => s !== 'Archivée'),
  ];
  const ACTIF_OPTIONS = [
    { value: 'true', label: 'Actives' },
    { value: 'false', label: 'Inactives' },
    { value: 'all', label: 'Toutes' },
  ];

  const {
    data: listData,
    isFetching: listLoading,
    refetch,
  } = useFacturesList({
    search,
    fournisseur: fournisseurFilter,
    statut: statutFilter,
    actif: actifFilter === 'all' ? null : actifFilter === 'true',
    page,
    pageSize,
  });
  const factures = listData?.factures || [];
  const total = listData?.total || 0;

  const canEdit = hasAccess('factures', 'peut_modifier');

  useEffect(() => {
    searchFactures(search);
  }, [search, searchFactures]);
  useEffect(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (statutFilter) params.set('statut', statutFilter);
      else params.delete('statut');
      params.set('actif', actifFilter);
      return params;
    });
  }, [statutFilter, actifFilter, setSearchParams]);

  const handleFournisseurInput = (e) => {
    const val = e.target.value;
    setQF(val);
    const match = fournisseurs.find(
      (f) => f.nom.toLowerCase() === val.toLowerCase()
    );
    setFournisseurFilter(match ? match.id : '');
    setPage(1);
  };

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
              <Input
                list="factures-list"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Recherche (numéro)"
                className="flex-1 min-w-[12rem]"
              />
              <datalist id="factures-list">
                {factureOptions.map((f) => (
                  <option key={f.id} value={f.numero || f.id}>
                    {`n°${f.numero || f.id} - ${f.fournisseur?.nom || ''}`}
                  </option>
                ))}
              </datalist>
              <div className="w-full sm:w-auto">
                <Input
                  list="fournisseurs-list"
                  value={qF}
                  onChange={handleFournisseurInput}
                  placeholder="Tous fournisseurs"
                  className="w-full sm:w-48"
                />
                <datalist id="fournisseurs-list">
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.nom} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {STATUT_OPTIONS.map((s) => (
                  <Button
                    key={s || 'Tous'}
                    size="sm"
                    variant={statutFilter === s ? 'default' : 'outline'}
                    onClick={() => {
                      setStatutFilter(s);
                      setPage(1);
                    }}
                  >
                    {s || 'Tous'}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {ACTIF_OPTIONS.map((o) => (
                  <Button
                    key={o.value}
                    size="sm"
                    variant={actifFilter === o.value ? 'default' : 'outline'}
                    onClick={() => {
                      setActifFilter(o.value);
                      setPage(1);
                    }}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
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
