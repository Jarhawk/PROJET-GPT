// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useAuditTrail } from "@/hooks/useAuditTrail";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";
import TableContainer from "@/components/ui/TableContainer";
import { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AuditTrail() {
  const { entries, fetchEntries, loading, error } = useAuditTrail();
  const { mama_id, loading: authLoading } = useAuth();
  const [table, setTable] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchEntries();
    }
  }, [authLoading, mama_id, fetchEntries]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetchEntries({ table, start: start || null, end: end || null });
  };

  if (loading) return <LoadingSpinner message="Chargement..." />;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto text-xs">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Audit avancé</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 items-end">
        <Input
          placeholder="Table"
          value={table}
          onChange={(e) => setTable(e.target.value)}
          className="w-32"
        />
        <Input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          aria-label="Date début"
          className="w-40"
        />
        <Input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          aria-label="Date fin"
          className="w-40"
        />
        <PrimaryButton type="submit">Filtrer</PrimaryButton>
      </form>
      <TableContainer className="mt-4">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Table</th>
              <th className="px-2 py-1">Opération</th>
              <th className="px-2 py-1">Utilisateur</th>
              <th className="px-2 py-1">Ancien</th>
              <th className="px-2 py-1">Nouveau</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="border px-2 py-1 whitespace-nowrap">
                  {new Date(e.date_action).toLocaleString()}
                </td>
                <td className="border px-2 py-1">{e.table_modifiee}</td>
                <td className="border px-2 py-1">{e.operation}</td>
                <td className="border px-2 py-1">{e.utilisateurs?.nom || e.utilisateur_id}</td>
                <td className="border px-2 py-1 font-mono break-all">
                  {JSON.stringify(e.donnees_avant)}
                </td>
                <td className="border px-2 py-1 font-mono break-all">
                  {JSON.stringify(e.donnees_apres)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
