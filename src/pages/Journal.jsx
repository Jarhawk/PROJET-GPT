// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { useLogs } from "@/hooks/useLogs";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import TableContainer from "@/components/ui/TableContainer";
import GlassCard from "@/components/ui/GlassCard";
import { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Journal() {
  const { mama_id, loading: authLoading } = useAuth();
  const { logs, fetchLogs, exportLogsToExcel } = useLogs();
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!authLoading && mama_id) fetchLogs();
  }, [authLoading, mama_id, fetchLogs]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    await fetchLogs({ search, startDate: startDate || null, endDate: endDate || null });
  };

  return (
    <div className="p-6 container mx-auto space-y-4">
      <Toaster position="top-right" />
      <GlassCard title="Filtrer" className="mb-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        <Input
          placeholder="Recherche action"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          aria-label="Date début"
        />
        <Input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          aria-label="Date fin"
        />
        <PrimaryButton type="submit">Filtrer</PrimaryButton>
        <SecondaryButton type="button" onClick={exportLogsToExcel}>
          Export Excel
        </SecondaryButton>
        </form>
      </GlassCard>
      <TableContainer>
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Action</th>
              <th className="px-2 py-1">Utilisateur</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td className="border px-2 py-1">
                  {new Date(l.created_at).toLocaleString()}
                </td>
                <td className="border px-2 py-1">{l.action}</td>
                <td className="border px-2 py-1">{l.utilisateurs?.nom || l.done_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
