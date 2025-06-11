import { useEffect, useState } from "react";
import { useSuppliers } from "@/hooks/useSuppliers";
import SupplierForm from "@/components/fournisseurs/SupplierForm";
import SupplierDetail from "@/components/fournisseurs/SupplierDetail";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

const PAGE_SIZE = 20;

export default function Fournisseurs() {
  const { suppliers, fetchSuppliers, deleteSupplier, toggleSupplierActive } = useSuppliers();
  const [search, setSearch] = useState("");
  const [actifFilter, setActifFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { fetchSuppliers(); }, []);

  // Filtrage et pagination
  const suppliersFiltres = suppliers.filter(s =>
    (!search || s.nom?.toLowerCase().includes(search.toLowerCase()) || s.ville?.toLowerCase().includes(search.toLowerCase()))
    && (actifFilter === "all" || (actifFilter === "true" ? s.actif : !s.actif))
  );
  const nbPages = Math.ceil(suppliersFiltres.length / PAGE_SIZE);
  const pagedSuppliers = suppliersFiltres.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Export Excel
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(suppliersFiltres);
    XLSX.utils.book_append_sheet(wb, ws, "Fournisseurs");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "fournisseurs.xlsx");
  };

  // Suppression avec confirmation
  const handleDelete = async (f) => {
    if (window.confirm(`Supprimer définitivement le fournisseur "${f.nom}" ?`)) {
      await deleteSupplier(f.id);
      await fetchSuppliers();
      toast.success("Fournisseur supprimé.");
    }
  };

  // Désactivation/réactivation
  const handleToggleActive = async (f) => {
    await toggleSupplierActive(f.id, !f.actif);
    await fetchSuppliers();
    toast.success(f.actif ? "Fournisseur désactivé" : "Fournisseur réactivé");
  };

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          placeholder="Recherche (nom, ville)"
        />
        <select className="input" value={actifFilter} onChange={e => setActifFilter(e.target.value)}>
          <option value="all">Tous</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          Ajouter un fournisseur
        </Button>
        <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
      </div>
      <motion.table
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-full bg-white rounded-xl shadow-md"
      >
        <thead>
          <tr>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Ville</th>
            <th className="px-4 py-2">Téléphone</th>
            <th className="px-4 py-2">Statut</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pagedSuppliers.map(s => (
            <tr key={s.id}>
              <td className="border px-4 py-2">
                <Button
                  variant="link"
                  className="font-semibold text-mamastockGold"
                  onClick={() => { setSelected(s); setShowDetail(true); }}
                >
                  {s.nom}
                </Button>
              </td>
              <td className="border px-4 py-2">{s.ville}</td>
              <td className="border px-4 py-2">{s.telephone}</td>
              <td className="border px-4 py-2">
                <span className={s.actif ? "badge badge-admin" : "badge badge-user"}>
                  {s.actif ? "Actif" : "Inactif"}
                </span>
              </td>
              <td className="border px-4 py-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setSelected(s); setShowForm(true); }}>Modifier</Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(s)}>Supprimer</Button>
                <Button size="sm" variant="outline" onClick={() => handleToggleActive(s)}>
                  {s.actif ? "Désactiver" : "Réactiver"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </motion.table>
      <div className="mt-4 flex gap-2">
        {Array.from({ length: nbPages }, (_, i) =>
          <Button
            key={i + 1}
            size="sm"
            variant={page === i + 1 ? "default" : "outline"}
            onClick={() => setPage(i + 1)}
          >{i + 1}</Button>
        )}
      </div>
      {/* Modal Ajout/Modif */}
      {showForm && (
        <SupplierForm
          supplier={selected}
          onClose={() => { setShowForm(false); setSelected(null); fetchSuppliers(); }}
        />
      )}
      {/* Modal Détail */}
      {showDetail && selected && (
        <SupplierDetail
          supplier={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
        />
      )}
    </div>
  );
}
