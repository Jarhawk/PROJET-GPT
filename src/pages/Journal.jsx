import { useEffect, useState } from "react";
import { useLogs } from "@/hooks/useLogs";
import { Button } from "@/components/ui/button";
import { Toaster } from "react-hot-toast";

export default function Journal() {
  const { logs, fetchLogs, exportLogsToExcel } = useLogs();
  const isCritical = action => /delete|drop|remove/i.test(action);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => { fetchLogs(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    await fetchLogs({ search, startDate: startDate || null, endDate: endDate || null });
  };

  return (
    <div className="p-6 container mx-auto">
      <Toaster position="top-right" />
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          className="input"
          placeholder="Recherche action"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="input"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          aria-label="Date début"
        />
        <input
          type="date"
          className="input"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          aria-label="Date fin"
        />
        <Button type="submit">Filtrer</Button>
        <Button variant="outline" type="button" onClick={exportLogsToExcel}>
          Export Excel
        </Button>
      </form>
      <table className="min-w-full bg-white rounded-xl shadow-md text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1">Date</th>
            <th className="px-2 py-1">Action</th>
            <th className="px-2 py-1">Utilisateur</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(l => (
            <tr key={l.id} className={isCritical(l.action) ? 'bg-red-50' : ''}>
              <td className="px-2 py-1">
                {new Date(l.created_at).toLocaleString()}
              </td>
              <td className="px-2 py-1">{l.action}</td>
              <td className="px-2 py-1">{l.users?.email || l.done_by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
