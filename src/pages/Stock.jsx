// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useStock } from "@/hooks/useStock";
import useAuth from "@/hooks/useAuth";
import StockMouvementForm from "@/components/stock/StockMouvementForm";
import StockDetail from "@/components/stock/StockDetail";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Toaster } from "react-hot-toast";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { motion as Motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const PAGE_SIZE = 20;

export default function Stock() {
  const { stocks, fetchStocks, fetchMouvements, mouvements } = useStock();
  const {
    mama_id,
    loading: authLoading,
    access_rights,
    isSuperadmin,
  } = useAuth();
  const canEdit = isSuperadmin || access_rights?.mouvements?.peut_modifier;
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchStocks();
      fetchMouvements();
    }
  }, [authLoading, mama_id, fetchStocks, fetchMouvements]);

  const filtered = stocks.filter(s =>
    !search || s.nom.toLowerCase().includes(search.toLowerCase())
  );
  const nbPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filtered);
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "stock.xlsx");
  };

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!access_rights?.mouvements?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }
  if (!mama_id) return null;

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          placeholder="Recherche produit"
        />
        {canEdit && (
          <Button onClick={() => { setSelected(null); setShowForm(true); }}>
            Mouvement stock
          </Button>
        )}
        {canEdit && (
          <Button variant="outline" onClick={exportExcel}>Export Excel</Button>
        )}
      </div>
      <TableContainer className="mt-4">
        <Motion.table
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-w-full text-sm"
        >
        <thead>
          <tr>
            <th className="px-4 py-2">Produit</th>
            <th className="px-4 py-2">Stock réel</th>
            <th className="px-4 py-2">Unité</th>
            <th className="px-4 py-2">PMP</th>
            <th className="px-4 py-2">Valorisation</th>
            {canEdit && <th className="px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {paged.map(s => (
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
              <td className="border px-4 py-2">{s.stock_reel}</td>
              <td className="border px-4 py-2">{s.unite}</td>
              <td className="border px-4 py-2">{s.pmp?.toFixed(2)}</td>
              <td className="border px-4 py-2">{(s.pmp * s.stock_reel).toFixed(2)} €</td>
              {canEdit && (
                <td className="border px-4 py-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelected(s);
                      setShowForm(true);
                    }}
                  >
                    Mouvement
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        </Motion.table>
      </TableContainer>
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
      {canEdit && showForm && (
        <StockMouvementForm
          produit={selected}
          onClose={() => { setShowForm(false); setSelected(null); fetchStocks(); fetchMouvements(); }}
        />
      )}
      {showDetail && selected && (
        <StockDetail
          produit={selected}
          mouvements={mouvements.filter(m => m.produit_id === selected.id)}
          onClose={() => { setShowDetail(false); setSelected(null); }}
        />
      )}
    </div>
  );
}
