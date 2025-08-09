// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useRequisitions } from "@/hooks/useRequisitions";
import useAuth from "@/hooks/useAuth";
import ListingContainer from "@/components/ui/ListingContainer";
import TableHeader from "@/components/ui/TableHeader";
import PaginationFooter from "@/components/ui/PaginationFooter";
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
      const { data, count } = await fetchRequisitions({
        search,
        page,
        limit: PAGE_SIZE,
      });
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
      <h1 className="text-xl font-bold mb-4">Demandes de stock</h1>
      <TableHeader className="mb-2">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="form-input"
          placeholder="Recherche produit"
        />
      </TableHeader>
      <ListingContainer>
        <table className="text-sm">
          <thead>
            <tr>
              <th className="p-2">Date de réquisition</th>
              <th className="p-2">Nom du produit</th>
              <th className="p-2 text-right">Quantité demandée</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <RequisitionRow key={r.id} requisition={r} />
            ))}
          </tbody>
        </table>
      </ListingContainer>
      <PaginationFooter
        page={page}
        pages={pageCount}
        onPageChange={setPage}
        className="mt-4"
      />
    </div>
  );
}
