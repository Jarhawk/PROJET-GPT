// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { useFactures } from "@/hooks/useFactures";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import useAuth from "@/hooks/useAuth";
import { useFacturesAutocomplete } from "@/hooks/useFacturesAutocomplete";
import FactureForm from "./FactureForm.jsx";
import FactureDetail from "./FactureDetail.jsx";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import TableContainer from "@/components/ui/TableContainer";
import GlassCard from "@/components/ui/GlassCard";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion as Motion } from "framer-motion";
import FactureRow from "@/components/factures/FactureRow.jsx";

const STATUTS = {
  brouillon: "badge",
  "en attente": "badge badge-user",
  validée: "badge badge-admin",
  payée: "badge badge-admin",
  refusée: "badge badge-superadmin",
  annulée: "badge badge-superadmin",
  archivée: "badge"
};

export default function Factures() {
  const { factures, total, getFactures, deleteFacture, toggleFactureActive } = useFactures();
  const { fournisseurs } = useFournisseurs();
  const { mama_id, loading: authLoading, hasAccess } = useAuth();
  const { results: factureOptions, searchFactures } = useFacturesAutocomplete();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [fournisseurFilter, setFournisseurFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [actifFilter, setActifFilter] = useState("true");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  // Export Excel/XLSX
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(factures.map(f => ({
      ...f,
      fournisseur_nom: fournisseurs.find(s => s.id === f.fournisseur_id)?.nom || f.fournisseur?.nom
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Factures");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "factures.xlsx");
  };

  // Filtres avancés
  const facturesFiltres = factures;

  // Suppression avec confirmation
  const handleDelete = async (facture) => {
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
      <GlassCard className="flex flex-wrap gap-4 items-end">
        <input
          list="factures-list"
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          placeholder="Recherche (numéro)"
        />
        <datalist id="factures-list">
          {factureOptions.map(f => (
            <option key={f.id} value={f.numero || f.id}>
              {`n°${f.numero || f.id} - ${f.fournisseur?.nom || ""}`}
            </option>
          ))}
        </datalist>
        <select
          className="input"
          value={fournisseurFilter}
          onChange={(e) => {
            setFournisseurFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous fournisseurs</option>
          {fournisseurs.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        <select
          className="input"
          value={statutFilter}
          onChange={(e) => {
            setStatutFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous statuts</option>
          {Object.keys(STATUTS).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="month"
          className="input"
          value={monthFilter}
          onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
        />
        <select
          className="input"
          value={actifFilter}
          onChange={(e) => {
            setActifFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="true">Actives</option>
          <option value="false">Inactives</option>
          <option value="all">Toutes</option>
        </select>
        {canEdit && (
          <Button
            onClick={() => {
              setSelected(null);
              setShowForm(true);
            }}
          >
            Ajouter une facture
          </Button>
        )}
        <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
      </GlassCard>
      <TableContainer className="mb-4">
        <Motion.table
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-w-full text-white"
        >
        <thead>
          <tr>
            <th className="px-4 py-2">Numéro</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Fournisseur</th>
            <th className="px-4 py-2">Montant TTC</th>
            <th className="px-4 py-2">Statut</th>
            <th className="px-4 py-2">Actif</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {facturesFiltres.map((facture) => (
            <FactureRow
              key={facture.id}
              facture={facture}
              canEdit={canEdit}
              onEdit={(f) => {
                setSelected(f);
                setShowForm(true);
              }}
              onDetail={(f) => {
                setSelected(f);
                setShowDetail(true);
              }}
              onToggleActive={async (id, actif) => {
                await toggleFactureActive(id, actif);
                refreshList();
              }}
              onArchive={handleDelete}
            />
          ))}
        </tbody>
        </Motion.table>
      </TableContainer>
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Précédent
        </Button>
        <span className="px-2">Page {page}</span>
        <Button
          variant="outline"
          disabled={page * pageSize >= total}
          onClick={() => setPage(p => p + 1)}
        >
          Suivant
        </Button>
      </div>
      {/* Modal d’ajout/modif */}
      {showForm && (
        <FactureForm
          facture={selected}
          fournisseurs={fournisseurs}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
            refreshList();
          }}
        />
      )}
      {/* Modal de détail */}
      {showDetail && selected && (
        <FactureDetail
          facture={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
        />
      )}
    </div>
  );
}
