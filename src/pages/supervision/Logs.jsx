// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useLogs } from "@/hooks/useLogs";

export default function LogsPage() {
  const { logs, fetchLogs, exportLogs, loading } = useLogs();
  const [filters, setFilters] = useState({ type: "", module: "", critique: "" });

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    const f = { ...filters };
    if (f.critique === "") delete f.critique; else f.critique = f.critique === "true";
    fetchLogs(f);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Logs activité</h1>
      <div className="flex gap-2 mb-4">
        <input
          name="type"
          placeholder="Type"
          value={filters.type}
          onChange={handleChange}
          className="border p-1"
        />
        <input
          name="module"
          placeholder="Module"
          value={filters.module}
          onChange={handleChange}
          className="border p-1"
        />
        <select name="critique" value={filters.critique} onChange={handleChange} className="border p-1">
          <option value="">Critique?</option>
          <option value="true">Oui</option>
          <option value="false">Non</option>
        </select>
        <button onClick={applyFilters} className="px-3 py-1 bg-mamastockGold text-white rounded">Filtrer</button>
        <button onClick={() => exportLogs("csv")} className="px-3 py-1 bg-blue-500 text-white rounded">CSV</button>
        <button onClick={() => exportLogs("xlsx")} className="px-3 py-1 bg-green-500 text-white rounded">Excel</button>
        <button onClick={() => exportLogs("pdf")} className="px-3 py-1 bg-red-500 text-white rounded">PDF</button>
      </div>

      {loading && <p>Chargement...</p>}
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="border px-2">Date</th>
            <th className="border px-2">Utilisateur</th>
            <th className="border px-2">Type</th>
            <th className="border px-2">Module</th>
            <th className="border px-2">Description</th>
            <th className="border px-2">Critique</th>
          </tr>
        </thead>
        <tbody>
          {(logs || []).map((l) => (
            <tr key={l.id} className="text-center">
              <td className="border px-2">{l.date_log}</td>
              <td className="border px-2">{l.user_id}</td>
              <td className="border px-2">{l.type}</td>
              <td className="border px-2">{l.module}</td>
              <td className="border px-2">{l.description}</td>
              <td className="border px-2">{l.critique ? "✔" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

