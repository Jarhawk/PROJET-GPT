import { useEffect, useState } from "react";
import { useFiches } from "@/hooks/useFiches";
import { useAuth } from "@/context/AuthContext";
import FicheForm from "./FicheForm.jsx";
import FicheDetail from "./FicheDetail.jsx";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Toaster } from "react-hot-toast";
import { motion as Motion } from "framer-motion";

const PAGE_SIZE = 20;

export default function Fiches() {
  const { fiches, total, getFiches, deleteFiche, exportFichesToExcel, exportFichesToPDF } = useFiches();
  const { mama_id, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Chargement
  useEffect(() => {
    if (!authLoading && mama_id) {
      getFiches({ search, page, limit: PAGE_SIZE });
    }
  }, [authLoading, mama_id, search, page, getFiches]);

  const exportExcel = () => exportFichesToExcel();
  const exportPdf = () => exportFichesToPDF();

  const fichesFiltres = fiches;


  return (
    <div className="p-6 container mx-auto text-shadow">
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
        <Button variant="outline" onClick={exportPdf}>Export PDF</Button>
      </div>
      <TableContainer className="mb-4">
        <Motion.table
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-w-full text-white"
        >
        <thead>
          <tr>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Famille</th>
            <th className="px-4 py-2">Coût/portion</th>
            <th className="px-4 py-2"># Produits</th>
            <th className="px-4 py-2">Actif</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {fichesFiltres.map((fiche) => (
            <tr key={fiche.id}>
              <td className="border px-4 py-2">
                <Button
                  variant="link"
                  className="font-semibold text-white"
                  onClick={() => { setSelected(fiche); setShowDetail(true); }}
                >
                  {fiche.nom}
                </Button>
              </td>
              <td className="border px-4 py-2">{fiche.famille?.nom || '-'}</td>
              <td className="border px-4 py-2">{Number(fiche.cout_par_portion).toFixed(2)} €</td>
              <td className="border px-4 py-2">{fiche.lignes?.length || 0}</td>
              <td className="border px-4 py-2">{fiche.actif ? '✅' : '❌'}</td>
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
                  onClick={() => { setSelected(fiche); setShowDetail(true); }}
                >
                  Voir
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteFiche(fiche.id)}
                >
                  Désactiver
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        </Motion.table>
      </TableContainer>
      <div className="mt-4 flex gap-2 justify-center">
        {Array.from({ length: Math.max(1, Math.ceil(total / PAGE_SIZE)) }, (_, i) => (
          <Button
            key={i}
            size="sm"
            variant={page === i + 1 ? "default" : "outline"}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </div>
      {showForm && (
        <FicheForm
          fiche={selected}
          onClose={() => { setShowForm(false); setSelected(null); getFiches({ search, page, limit: PAGE_SIZE }); }}
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
