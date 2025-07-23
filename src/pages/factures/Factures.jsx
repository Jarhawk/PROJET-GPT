// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useFactures } from "@/hooks/useFactures";
import { useSuppliers } from "@/hooks/useSuppliers";
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
  const { suppliers } = useSuppliers();
  const { mama_id, loading: authLoading } = useAuth();
  const { results: factureOptions, searchFactures } = useFacturesAutocomplete();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [actifFilter, setActifFilter] = useState("true");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);

  useEffect(() => { searchFactures(search); }, [search, searchFactures]);

  useEffect(() => {
    if (mama_id) getFactures({
      search,
      fournisseur: supplierFilter,
      statut: statutFilter,
      mois: monthFilter,
      actif: actifFilter === "all" ? null : actifFilter === "true",
      page,
      pageSize,
    });
  }, [mama_id, search, statutFilter, supplierFilter, monthFilter, actifFilter, page]);

  // Export Excel/XLSX
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(factures.map(f => ({
      ...f,
      fournisseur_nom: suppliers.find(s => s.id === f.fournisseur_id)?.nom || f.fournisseur?.nom
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
      await getFactures({
        search,
        fournisseur: supplierFilter,
        statut: statutFilter,
        mois: monthFilter,
        actif: actifFilter === "all" ? null : actifFilter === "true",
        page,
        pageSize,
      });
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
              {`n°${f.numero || f.id} - ${f.fournisseurs?.nom || ""}`}
            </option>
          ))}
        </datalist>
        <select className="input" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
          <option value="">Tous fournisseurs</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        <select className="input" value={statutFilter} onChange={e => setStatutFilter(e.target.value)}>
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
          onChange={e => setActifFilter(e.target.value)}
        >
          <option value="true">Actives</option>
          <option value="false">Inactives</option>
          <option value="all">Toutes</option>
        </select>
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          Ajouter une facture
        </Button>
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
            <tr key={facture.id}>
              <td className="border px-4 py-2">{facture.numero || facture.id}</td>
              <td className="border px-4 py-2">{facture.date_facture}</td>
              <td className="border px-4 py-2">{facture.fournisseur?.nom}</td>
              <td className="border px-4 py-2">{facture.total_ttc?.toFixed(2)} €</td>
              <td className="border px-4 py-2">
                <span className={STATUTS[facture.statut] || "badge"}>{facture.statut}</span>
              </td>
              <td className="border px-4 py-2">{facture.actif ? "✅" : "❌"}</td>
              <td className="border px-4 py-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="mr-2"
                  onClick={() => { setSelected(facture); setShowForm(true); }}
                >
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="mr-2"
                  onClick={() => { setSelected(facture); setShowDetail(true); }}
                >
                  Détail
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="mr-2"
                  onClick={async () => {
                    await toggleFactureActive(facture.id, !facture.actif);
                    await getFactures({
                      search,
                      fournisseur: supplierFilter,
                      statut: statutFilter,
                      mois: monthFilter,
                      actif: actifFilter === "all" ? null : actifFilter === "true",
                      page,
                      pageSize,
                    });
                  }}
                >
                  {facture.actif ? "Désactiver" : "Réactiver"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="mr-2"
                  onClick={() => handleDelete(facture)}
                  disabled={loading}
                >
                  Archiver
                </Button>
              </td>
            </tr>
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
          suppliers={suppliers}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
            getFactures({
              search,
              fournisseur: supplierFilter,
              statut: statutFilter,
              mois: monthFilter,
              actif: actifFilter === "all" ? null : actifFilter === "true",
              page,
              pageSize,
            });
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
