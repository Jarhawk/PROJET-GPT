// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useLogs } from "@/hooks/useLogs";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";
import TableContainer from "@/components/ui/TableContainer";
import GlassCard from "@/components/ui/GlassCard";
import { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Logs() {
  const { mama_id, loading: authLoading } = useAuth();
  const { logs, fetchLogs, loading, error } = useLogs();
  const [ip, setIp] = useState("");
  const [utilisateur, setUtilisateur] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    if (!authLoading && mama_id) fetchLogs();
  }, [authLoading, mama_id, fetchLogs]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetchLogs({ ip: ip || undefined, utilisateur: utilisateur || undefined, date: date || undefined, type: type || undefined });
  };

  return (
    <div className="p-6 container mx-auto space-y-4 text-sm">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold">Logs sécurité & activité</h1>
      <GlassCard title="Filtrer" className="mb-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        <Input placeholder="IP" value={ip} onChange={(e) => setIp(e.target.value)} className="w-32" />
        <Input placeholder="Utilisateur id" value={utilisateur} onChange={(e) => setUtilisateur(e.target.value)} className="w-40" />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input placeholder="Type" value={type} onChange={(e) => setType(e.target.value)} className="w-32" />
        <PrimaryButton type="submit">Filtrer</PrimaryButton>
        </form>
      </GlassCard>
      {loading ? (
        <LoadingSpinner message="Chargement..." />
      ) : error ? (
        <div className="text-red-600">{error.message || error}</div>
      ) : (
        <TableContainer>
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1">Date</th>
                <th className="px-2 py-1">Type</th>
                <th className="px-2 py-1">IP</th>
                <th className="px-2 py-1">Utilisateur</th>
                <th className="px-2 py-1">Détails</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id + (l.source || "")} className="align-top">
                  <td className="border px-2 py-1 whitespace-nowrap">{new Date(l.date_action || l.date_evenement || l.created_at).toLocaleString()}</td>
                  <td className="border px-2 py-1">{l.action || l.type_evenement}</td>
                  <td className="border px-2 py-1">{l.ip || ""}</td>
                  <td className="border px-2 py-1">{l.utilisateurs?.nom || l.utilisateur_id}</td>
                  <td className="border px-2 py-1 font-mono break-all">{JSON.stringify(l.details || l.description || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}
    </div>
  );
}
