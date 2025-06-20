import { useEffect, useState } from "react";
import { useAuditTrail } from "@/hooks/useAuditTrail";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Toaster } from "react-hot-toast";

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

  if (loading) return <div className="p-8">Chargement...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto text-xs">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Audit avancé</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 items-end">
        <input
          className="input"
          placeholder="Table"
          value={table}
          onChange={(e) => setTable(e.target.value)}
        />
        <input
          type="date"
          className="input"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          aria-label="Date début"
        />
        <input
          type="date"
          className="input"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          aria-label="Date fin"
        />
        <Button type="submit">Filtrer</Button>
      </form>
      <table className="min-w-full bg-white rounded-xl shadow-md">
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
              <td className="px-2 py-1 whitespace-nowrap">
                {new Date(e.changed_at).toLocaleString()}
              </td>
              <td className="px-2 py-1">{e.table_name}</td>
              <td className="px-2 py-1">{e.operation}</td>
              <td className="px-2 py-1">{e.users?.email || e.changed_by}</td>
              <td className="px-2 py-1 font-mono break-all">
                {JSON.stringify(e.old_data)}
              </td>
              <td className="px-2 py-1 font-mono break-all">
                {JSON.stringify(e.new_data)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
