// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { useFournisseurApiConfig } from "@/hooks/useFournisseurApiConfig";
import { Link } from "react-router-dom";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ApiFournisseurs() {
  const { mama_id } = useAuth();
  const { listConfigs, loading, error } = useFournisseurApiConfig();
  const [configs, setConfigs] = useState([]);
  const PAGE_SIZE = 50;
  const [page] = useState(1);

  useEffect(() => {
    if (!mama_id) return;
    listConfigs({ page, limit: PAGE_SIZE }).then(({ data }) => {
      setConfigs(Array.isArray(data) ? data : []);
    });
  }, [mama_id, page, listConfigs]);

  if (loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 container mx-auto text-sm space-y-4">
      <h1 className="text-2xl font-bold">API Fournisseurs</h1>
      {error && <div className="text-red-600">{error.message || error}</div>}
      <TableContainer>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Fournisseur</th>
              <th className="px-2 py-1 text-left">URL</th>
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-left">Actif</th>
              <th className="px-2 py-1" />
            </tr>
          </thead>
          <tbody>
            {configs.map((c) => (
              <tr key={c.fournisseur_id} className="border-t">
                <td className="px-2 py-1">{c.fournisseur?.nom || c.fournisseur_id}</td>
                <td className="px-2 py-1">{c.url}</td>
                <td className="px-2 py-1">{c.type_api}</td>
                <td className="px-2 py-1">{c.actif ? "Oui" : "Non"}</td>
                <td className="px-2 py-1 text-right">
                  <Link className="underline" to={`/fournisseurs/${c.fournisseur_id}/api`}>Éditer</Link>
                </td>
              </tr>
            ))}
            {configs.length === 0 && (
              <tr>
                <td colSpan="5" className="py-4 text-center text-gray-500">
                  Aucune configuration
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
