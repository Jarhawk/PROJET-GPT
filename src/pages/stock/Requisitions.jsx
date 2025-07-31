// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useRequisitions } from "@/hooks/useRequisitions";
import useAuth from "@/hooks/useAuth";
import TableContainer from "@/components/ui/TableContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import RequisitionRow from "@/components/requisitions/RequisitionRow";

const PAGE_SIZE = 20;

export default function RequisitionsPage() {
  const { fetchRequisitions } = useRequisitions();
  const { mama_id, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mama_id || authLoading) return;
    (async () => {
      setLoading(true);
      const { data, count } = await fetchRequisitions({ search, page, limit: PAGE_SIZE });
      setItems(data);
      setTotal(count);
      setLoading(false);
    })();
  }, [mama_id, authLoading, search, page, fetchRequisitions]);

  const pageCount = Math.ceil(total / PAGE_SIZE) || 1;

  if (authLoading || loading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-mamastock-gold mb-4">Demandes de stock</h1>
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <Input
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Recherche produit"
        />
      </div>
      <TableContainer>
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th className="p-2">Date de réquisition</th>
              <th className="p-2">Nom du produit</th>
              <th className="p-2">Quantité demandée</th>
            </tr>
          </thead>
          <tbody>
            {items.map(r => (
              <RequisitionRow key={r.id} requisition={r} />
            ))}
          </tbody>
        </table>
      </TableContainer>
      <div className="flex justify-center gap-2 mt-4">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Précédent
        </Button>
        <span className="px-2">Page {page} / {pageCount}</span>
        <Button
          variant="outline"
          disabled={page >= pageCount}
          onClick={() => setPage(p => Math.min(pageCount, p + 1))}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
