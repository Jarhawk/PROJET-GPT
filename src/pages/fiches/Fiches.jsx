// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useFiches } from "@/hooks/useFiches";
import useAuth from "@/hooks/useAuth";
import FicheForm from "./FicheForm.jsx";
import FicheDetail from "./FicheDetail.jsx";
import FicheRow from "@/components/fiches/FicheRow.jsx";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { useFamilles } from "@/hooks/useFamilles";
import { Toaster, toast } from "react-hot-toast";
import { motion as Motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const PAGE_SIZE = 20;

export default function Fiches() {
  const {
    fiches,
    total,
    loading,
    getFiches,
    deleteFiche,
    duplicateFiche,
    exportFichesToExcel,
    exportFichesToPDF,
  } = useFiches();
  const { mama_id, loading: authLoading, access_rights, hasAccess } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("nom");
  const [actif, setActif] = useState("true");
  const [familleFilter, setFamilleFilter] = useState("");
  const { familles, fetchFamilles } = useFamilles();
  const canEdit = hasAccess("fiches_techniques", "peut_modifier");

  const refreshList = useCallback(() => {
    getFiches({
      search,
      actif: actif === "all" ? null : actif === "true",
      famille: familleFilter || null,
      page,
      limit: PAGE_SIZE,
      sortBy,
    });
  }, [getFiches, search, actif, familleFilter, page, sortBy]);

  // Chargement
  useEffect(() => {
    if (!authLoading && mama_id) {
      refreshList();
      fetchFamilles();
    }
  }, [authLoading, mama_id, refreshList, fetchFamilles]);

  const exportExcel = () => exportFichesToExcel();
  const exportPdf = () => exportFichesToPDF();

  const fichesFiltres = fiches;
  if (authLoading || loading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (!access_rights?.fiches_techniques?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="p-6 container mx-auto text-shadow">
      <Toaster position="top-right" />
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="input"
          placeholder="Recherche fiche"
        />
        <select
          className="input"
          value={sortBy}
          onChange={(e) => {
            setPage(1);
            setSortBy(e.target.value);
          }}
        >
          <option value="nom">Tri: Nom</option>
          <option value="cout_par_portion">Tri: Coût/portion</option>
        </select>
        <select
          className="input"
          value={actif}
          onChange={(e) => {
            setPage(1);
            setActif(e.target.value);
          }}
        >
          <option value="true">Actives</option>
          <option value="false">Inactives</option>
          <option value="all">Toutes</option>
        </select>
        <select
          className="input"
          value={familleFilter}
          onChange={(e) => {
            setPage(1);
            setFamilleFilter(e.target.value);
          }}
        >
          <option value="">-- Famille --</option>
          {familles.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nom}
            </option>
          ))}
        </select>
        {canEdit && (
          <Button
            onClick={() => {
              setSelected(null);
              setShowForm(true);
            }}
          >
            Ajouter une fiche
          </Button>
        )}
        <Button variant="outline" onClick={exportExcel}>
          Export Excel
        </Button>
        <Button variant="outline" onClick={exportPdf}>
          Export PDF
        </Button>
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
              <FicheRow
                key={fiche.id}
                fiche={fiche}
                canEdit={canEdit}
                onEdit={(f) => {
                  setSelected(f);
                  setShowForm(true);
                }}
                onDetail={(f) => {
                  setSelected(f);
                  setShowDetail(true);
                }}
                onDuplicate={async (id) => {
                  await duplicateFiche(id);
                  toast.success("Fiche dupliquée");
                  refreshList();
                }}
                onDelete={(id) => {
                  if (window.confirm("Désactiver cette fiche ?")) {
                    deleteFiche(id);
                    toast.success("Fiche désactivée");
                    refreshList();
                  }
                }}
              />
            ))}
          </tbody>
        </Motion.table>
      </TableContainer>
      <div className="mt-4 flex gap-2 justify-center">
        {Array.from(
          { length: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
          (_, i) => (
            <Button
              key={i + 1}
              size="sm"
              variant={page === i + 1 ? "default" : "outline"}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ),
        )}
      </div>
      {showForm && (
        <FicheForm
          fiche={selected}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
            refreshList();
          }}
        />
      )}
      {showDetail && selected && (
        <FicheDetail
          fiche={selected}
          onClose={() => {
            setShowDetail(false);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
