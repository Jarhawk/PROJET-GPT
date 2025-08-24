// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useRef } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import useDebounce from "@/hooks/useDebounce";
import { useFichesTechniques } from "@/hooks/data/useFichesTechniques";
import { useFiches } from "@/hooks/useFiches";
import FicheForm from "./FicheForm.jsx";
import FicheDetail from "./FicheDetail.jsx";
import FicheRow from "@/components/fiches/FicheRow.jsx";
import { Button } from "@/components/ui/button";
import ListingContainer from "@/components/ui/ListingContainer";
import PaginationFooter from "@/components/ui/PaginationFooter";
import TableHeader from "@/components/ui/TableHeader";
import { useFamilles } from "@/hooks/useFamilles";
import { toast } from 'sonner';
import { motion as Motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import JSPDF from "jspdf";
import "jspdf-autotable";

const PAGE_SIZE = 20;

export default function Fiches() {
  const queryClient = useQueryClient();
  const { deleteFiche, duplicateFiche } = useFiches();
  const { mama_id, loading: authLoading, access_rights, hasAccess } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("nom");
  const [statut, setStatut] = useState("actif");
  const [familleFilter, setFamilleFilter] = useState("");
  const { familles, fetchFamilles } = useFamilles();
  const canEdit = hasAccess("fiches_techniques", "peut_modifier");

  const debouncedSearch = useDebounce(search, 300);

  const familleNom = familles.find(f => f.id === familleFilter)?.nom || null;
  const { data, isLoading, isError } = useFichesTechniques({
    page,
    search: debouncedSearch,
    statut,
    famille: familleNom,
    sortBy,
  });
  const rows = data?.rows || [];
  const total = data?.total || 0;

  const [searchParams, setSearchParams] = useSearchParams();
  const firstSync = useRef(true);

  // Lecture initiale de l'URL et chargement des familles
  useEffect(() => {
    if (firstSync.current) {
      firstSync.current = false;
      const q = searchParams.get('q') || '';
      const p = parseInt(searchParams.get('page') || '1', 10);
      setSearch(q);
      setPage(Number.isNaN(p) ? 1 : p);
    }
    fetchFamilles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Écriture contrôlée dans l'URL
  useEffect(() => {
    if (firstSync.current) return;
    const next = new URLSearchParams(searchParams);
    next.set('q', search || '');
    next.set('page', String(page));
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [search, page, setSearchParams]);

  const exportExcel = () => {
    const datas = rows.map((f) => ({
      id: f.id,
      nom: f.nom,
      cout_par_portion: f.cout_par_portion,
      actif: f.actif,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datas), "Fiches");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "fiches_mamastock.xlsx");
  };

  const exportPdf = () => {
    const doc = new JSPDF();
    const rowsPdf = rows.map((f) => [
      f.nom,
      f.famille || '',
      f.cout_par_portion,
    ]);
    doc.autoTable({ head: [["Nom", "Famille", "Coût/portion"]], body: rowsPdf });
    doc.save("fiches_mamastock.pdf");
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (isError) {
    return <div className="p-6">Erreur chargement fiches techniques.</div>;
  }

  if (!access_rights?.fiches_techniques?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="p-6 container mx-auto text-shadow">
            <TableHeader>
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="form-input"
          placeholder="Recherche fiche"
        />
        <select
          className="form-input"
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
          className="form-input"
          value={statut}
          onChange={(e) => {
            setPage(1);
            setStatut(e.target.value);
          }}
        >
          <option value="actif">Actives</option>
          <option value="inactif">Inactives</option>
          <option value="tous">Toutes</option>
        </select>
        <select
          className="form-input"
          value={familleFilter}
          onChange={(e) => {
            setPage(1);
            setFamilleFilter(e.target.value);
          }}
        >
          <option value="">-- Famille --</option>
            {(familles ?? []).map((f) => (
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
      </TableHeader>
      <ListingContainer className="mb-4">
        <Motion.table
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-w-full text-sm"
        >
          <thead>
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Famille</th>
              <th className="px-4 py-2 text-right">Coût/portion</th>
              <th className="px-4 py-2 text-right"># Produits</th>
              <th className="px-4 py-2">Actif</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((fiche) => (
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
                  queryClient.invalidateQueries({ queryKey: ['fiches'] });
                }}
                onDelete={(id) => {
                  if (window.confirm("Désactiver cette fiche ?")) {
                    deleteFiche(id);
                    toast.success("Fiche désactivée");
                    queryClient.invalidateQueries({ queryKey: ['fiches'] });
                  }
                }}
              />
            ))}
          </tbody>
        </Motion.table>
      </ListingContainer>
      <PaginationFooter
        page={page}
        pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        onPageChange={setPage}
      />
      {showForm && (
        <FicheForm
          fiche={selected}
          onClose={() => {
            setShowForm(false);
            setSelected(null);
            queryClient.invalidateQueries({ queryKey: ['fiches'] });
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
