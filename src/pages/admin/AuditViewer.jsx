import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function AuditViewer() {
  const { mama_id } = useAuth();
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!mama_id) return;
    setLoading(true);
    const { data: audit } = await supabase
      .from("logs_audit")
      .select("*, utilisateurs:user_id(email)")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false })
      .limit(200);
    const { data: security } = await supabase
      .from("logs_securite")
      .select("*, utilisateurs:user_id(email)")
      .eq("mama_id", mama_id)
      .order("created_at", { ascending: false })
      .limit(200);
    const combined = [];
    (audit || []).forEach((l) => combined.push({ ...l, _source: "audit" }));
    (security || []).forEach((l) => combined.push({ ...l, _source: "security" }));
    let rows = combined;
    if (user) rows = rows.filter((l) => l.user_id === user);
    if (type) rows = rows.filter((l) => l.action === type || l.type === type);
    if (date) rows = rows.filter((l) => l.created_at.startsWith(date));
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setLogs(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [mama_id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="p-8 container mx-auto text-sm">
      <h1 className="text-2xl font-bold mb-4">Journal d'audit</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 items-end">
        <input
          className="input"
          placeholder="Utilisateur id"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <input
          className="input"
          placeholder="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Button type="submit">Filtrer</Button>
      </form>
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <table className="min-w-full bg-white rounded-xl shadow-md">
          <thead>
            <tr>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Utilisateur</th>
              <th className="px-2 py-1">Action</th>
              <th className="px-2 py-1">Détails</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={`${l.id}-${l._source}`} className="align-top">
                <td className="px-2 py-1 whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString()}
                </td>
                <td className="px-2 py-1">{l.utilisateurs?.email || l.user_id}</td>
                <td className="px-2 py-1">
                  {l._source === "security" ? "🛡️" : "✏️"} {l.action || l.type}
                </td>
                <td className="px-2 py-1 font-mono break-all">
                  {JSON.stringify(l.details || l.description || {})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
