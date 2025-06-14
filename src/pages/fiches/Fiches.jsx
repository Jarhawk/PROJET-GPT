import { useEffect, useState } from "react";
import { useFiches } from "@/hooks/useFiches";
import FicheForm from "./FicheForm.jsx";
import FicheDetail from "./FicheDetail.jsx";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion as Motion } from "framer-motion";

export default function Fiches() {
  const { fiches, fetchFiches, deleteFiche } = useFiches();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [familleFilter] = useState("");

  // Charge les fiches au montage uniquement
  useEffect(() => { fetchFiches(); }, []);

  // Export Excel
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(fiches);
    XLSX.utils.book_append_sheet(wb, ws, "Fiches");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "fiches.xlsx");
  };

  const fichesFiltres = fiches.filter(f =>
    (!search || f.nom?.toLowerCase().includes(search.toLowerCase())) &&
    (!familleFilter || f.famille === familleFilter)
  );

  // Suppression fiche
  const handleDelete = async (fiche) => {
    if (window.confirm(`Supprimer la fiche technique "${fiche.nom}" ?`)) {
      await deleteFiche(fiche.id);
      await fetchFiches();
      toast.success("Fiche supprimée.");
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
          placeholder="Recherche fiche"
        />
        {/* Ajout d’un filtre famille si besoin */}
        <Button onClick={() => { setSelected(null); setShowForm(true); }}>
          Ajouter une fiche
        </Button>
        <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
      </div>
      <Motion.table
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-full bg-white rounded-xl shadow-md"
      >
        <thead>
          <tr>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Portions</th>
            <th className="px-4 py-2">Coût total</th>
            <th className="px-4 py-2">Coût/portion</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {fichesFiltres.map((fiche) => (
            <tr key={fiche.id}>
              <td className="border px-4 py-2">
                <Button
                  variant="link"
                  className="font-semibold text-mamastockGold"
                  onClick={() => { setSelected(fiche); setShowDetail(true); }}
                >
                  {fiche.nom}
                </Button>
              </td>
              <td className="border px-4 py-2">{fiche.portions}</td>
              <td className="border px-4 py-2">{fiche.cout_total?.toFixed(2)} €</td>
              <td className="border px-4 py-2">{fiche.cout_par_portion?.toFixed(2)} €</td>
              <td className="border px-4 py-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="mr-2"
                  onClick={() => { setSelected(fiche); setShowForm(true); }}
                >
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="mr-2"
                  onClick={() => handleDelete(fiche)}
                >
                  Supprimer
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Motion.table>
      {showForm && (
        <FicheForm
          fiche={selected}
          onClose={() => { setShowForm(false); setSelected(null); fetchFiches(); }}
        />
      )}
      {showDetail && selected && (
        <FicheDetail
          fiche={selected}
          onClose={() => { setShowDetail(false); setSelected(null); }}
        />
      )}
    </div>
  );
}
