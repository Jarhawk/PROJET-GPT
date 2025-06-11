import { useEffect, useState } from "react";
import { useInventaires } from "@/hooks/useInventaires";
import InventaireForm from "@/components/inventaires/InventaireForm";
import InventaireDetail from "@/components/inventaires/InventaireDetail";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

const PAGE_SIZE = 10;

export default function Inventaires() {
  const { inventaires, fetchInventaires, deleteInventaire } = useInventaires();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchInventaires(); }, []);

  // Filtrage/pagination
  const filtres = inventaires.filter(i =>
    !search || i.nom?.toLowerCase().includes(search.toLowerCase())
  );
  const nbPages = Math.ceil(filtres.length / PAGE_SIZE);
  const paged = filtres.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Export Excel
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filtres);
    XLSX.utils.book_append_sheet(wb, ws, "Inventaires");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "inventaires.xlsx");
  };

  // Suppression (si pas clôturé)
  const handleDelete = async (inv) => {
    if (inv.cloture) return toast.error("Impossible de supprimer un inventaire clôturé.");
    if (window.confirm(`Supprimer l’inventaire "${inv.nom}" ?`)) {
      await deleteInventaire(inv.id);
      await fetchInventaires();
      toast.success("Inventaire supprimé.");
    }
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
          placeholder="Recherche inventaire"
        />
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          Ajouter un inventaire
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
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Nb produits</th>
            <th className="px-4 py-2">Clôture</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(inv => (
            <tr key={inv.id}>
              <td className="border px-4 py-2">
                <Button
                  variant="link"
                  className="font-semibold text-mamastockGold"
                  onClick={() => { setSelected(inv); setShowDetail(true); }}
                >
                  {inv.nom}
                </Button>
              </td>
              <td className="border px-4 py-2">{inv.date}</td>
              <td className="border px-4 py-2">{inv.lignes?.length || 0}</td>
              <td className="border px-4 py-2">
                <span className={inv.cloture ? "badge badge-admin" : "badge badge-user"}>
                  {inv.cloture ? "Clôturé" : "Ouvert"}
                </span>
              </td>
              <td className="border px-4 py-2 flex gap-2">
                {!inv.cloture &&
                  <Button size="sm" variant="outline" onClick={() => { setSelected(inv); setShowForm(true); }}>Modifier</Button>
                }
                <Button size="sm" variant="outline" onClick={() => handleDelete(inv)} disabled={inv.cloture}>Supprimer</Button>
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
      {showForm && (
        <InventaireForm
          inventaire={selected}
          onClose={() => { setShowForm(false); setSelected(null); fetchInventaires(); }}
        />
      )}
      {showDetail && selected && (
        <InventaireDetail
          inventaire={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
        />
      )}
    </div>
  );
}
