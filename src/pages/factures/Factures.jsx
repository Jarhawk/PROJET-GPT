import { useEffect, useState } from "react";
import { useFactures } from "@/hooks/useFactures";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuth } from "@/context/AuthContext";
import FactureForm from "./FactureForm.jsx";
import FactureDetail from "./FactureDetail.jsx";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion as Motion } from "framer-motion";

const STATUTS = {
  "en attente": "badge badge-user",
  "payée": "badge badge-admin",
  "refusée": "badge badge-superadmin"
};

export default function Factures() {
  const { factures, total, getFactures, deleteFacture } = useFactures();
  const { suppliers } = useSuppliers();
  const { mama_id } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mama_id) getFactures({
      search,
      fournisseur: supplierFilter,
      statut: statutFilter,
      mois: monthFilter,
      page,
      pageSize,
    });
  }, [mama_id, search, statutFilter, supplierFilter, monthFilter, page]);

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
    if (window.confirm(`Supprimer la facture n°${facture.id} ?`)) {
      setLoading(true);
      await deleteFacture(facture.id);
      await getFactures({
        search,
        fournisseur: supplierFilter,
        statut: statutFilter,
        mois: monthFilter,
        page,
        pageSize,
      });
      setLoading(false);
      toast.success("Facture supprimée.");
    }
  };

  return (
    <div className="p-6 container mx-auto text-shadow">
      <Toaster position="top-right" />
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          placeholder="Recherche (nom fournisseur, n°)"
        />
        <select className="input" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
          <option value="">Tous fournisseurs</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        <select className="input" value={statutFilter} onChange={e => setStatutFilter(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="en attente">En attente</option>
          <option value="payée">Payée</option>
          <option value="refusée">Refusée</option>
        </select>
        <input
          type="month"
          className="input"
          value={monthFilter}
          onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
        />
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          Ajouter une facture
        </Button>
        <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
      </div>
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
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {facturesFiltres.map((facture) => (
            <tr key={facture.id}>
              <td className="border px-4 py-2">{facture.reference || facture.id}</td>
              <td className="border px-4 py-2">{facture.date}</td>
              <td className="border px-4 py-2">{facture.fournisseur?.nom}</td>
              <td className="border px-4 py-2">{facture.total_ttc?.toFixed(2)} €</td>
              <td className="border px-4 py-2">
                <span className={STATUTS[facture.statut] || "badge"}>{facture.statut}</span>
              </td>
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
                  onClick={() => handleDelete(facture)}
                  disabled={loading}
                >
                  Supprimer
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
