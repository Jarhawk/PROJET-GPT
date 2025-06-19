import { useEffect, useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import FactureForm from "./FactureForm.jsx";
import FactureDetail from "./FactureDetail.jsx";
import { Button } from "@/components/ui/button";
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
  const { invoices, fetchInvoices, deleteInvoice } = useInvoices();
  const { suppliers } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchInvoices(); }, []);

  // Export Excel/XLSX
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(invoices.map(f => ({
      ...f,
      fournisseur_nom: suppliers.find(s => s.id === f.fournisseur_id)?.nom || f.fournisseur?.nom
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Factures");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "factures.xlsx");
  };

  // Filtres avancés
  const facturesFiltres = invoices.filter(f =>
    (!search || (f.fournisseur?.nom?.toLowerCase().includes(search.toLowerCase()) || f.id?.toString().includes(search)))
    && (!statutFilter || f.statut === statutFilter)
    && (!supplierFilter || f.fournisseur_id === supplierFilter)
  );

  // Suppression avec confirmation
  const handleDelete = async (facture) => {
    if (window.confirm(`Supprimer la facture n°${facture.id} ?`)) {
      setLoading(true);
      await deleteInvoice(facture.id);
      await fetchInvoices();
      setLoading(false);
      toast.success("Facture supprimée.");
    }
  };

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <label htmlFor="facture-search" className="sr-only">Recherche</label>
        <input
          id="facture-search"
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
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          Ajouter une facture
        </Button>
        <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
      </div>
      <Motion.table
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-full bg-white rounded-xl shadow-md"
      >
        <caption className="sr-only">Liste des factures</caption>
        <thead>
          <tr>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Fournisseur</th>
            <th className="px-4 py-2">Montant</th>
            <th className="px-4 py-2">Statut</th>
            <th className="px-4 py-2">Justificatif</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {facturesFiltres.map((facture) => (
            <tr key={facture.id}>
              <td className="border px-4 py-2">{facture.date}</td>
              <td className="border px-4 py-2">{facture.fournisseur?.nom}</td>
              <td className="border px-4 py-2">{facture.montant?.toFixed(2)} €</td>
              <td className="border px-4 py-2">
                <span className={STATUTS[facture.statut] || "badge"}>{facture.statut}</span>
              </td>
              <td className="border px-4 py-2">
                {facture.justificatif ?
                  <a href={facture.justificatif} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Voir</a> :
                  <span className="text-gray-400">Aucun</span>
                }
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
      {/* Modal d’ajout/modif */}
      {showForm && (
        <FactureForm
          facture={selected}
          suppliers={suppliers}
          onClose={() => { setShowForm(false); setSelected(null); fetchInvoices(); }}
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
