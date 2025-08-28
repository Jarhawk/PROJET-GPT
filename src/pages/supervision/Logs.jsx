// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useLogs } from "@/hooks/useLogs";
import GlassCard from "@/components/ui/GlassCard";
import TableContainer from "@/components/ui/TableContainer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Select } from "@/components/ui/select";
import Checkbox from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/SmartDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/badge";

const TYPES = ["login", "update_produit", "delete_facture", "export_pdf"];
const MODULES = ["produits", "factures", "inventaire"];

export default function Logs() {
  const { mama_id, loading: authLoading } = useAuth();
  const { logs, fetchLogs, exportLogs, loading } = useLogs();
  const [filters, setFilters] = useState({ start: "", end: "", type: "", module: "", critique: false });
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    await fetchLogs({
      type: filters.type || undefined,
      module: filters.module || undefined,
      start: filters.start || undefined,
      end: filters.end || undefined,
      critique: filters.critique ? true : undefined,
    });
  }, [fetchLogs, filters]);

  useEffect(() => {
    if (!authLoading && mama_id) load();
  }, [authLoading, mama_id, load]);

  const handleSubmit = (e) => {
    e.preventDefault();
    load();
  };

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  return (
    <div className="p-6 container mx-auto space-y-4 text-sm">
      <h1 className="text-2xl font-bold">Logs activité</h1>
      <GlassCard title="Filtres" className="mb-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <Input type="date" value={filters.start} onChange={(e) => setFilters({ ...filters, start: e.target.value })} />
          <Input type="date" value={filters.end} onChange={(e) => setFilters({ ...filters, end: e.target.value })} />
          <Select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">Type</option>
            {(Array.isArray(TYPES) ? TYPES : []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select value={filters.module} onChange={(e) => setFilters({ ...filters, module: e.target.value })}>
            <option value="">Module</option>
            {(Array.isArray(MODULES) ? MODULES : []).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-1">
            <Checkbox
              checked={filters.critique}
              onChange={(e) => setFilters({ ...filters, critique: e.target.checked })}
            />
            Critique
          </label>
          <PrimaryButton type="submit">Filtrer</PrimaryButton>
          <Button type="button" onClick={() => exportLogs("csv")}>CSV</Button>
          <Button type="button" onClick={() => exportLogs("xlsx")}>Excel</Button>
          <Button type="button" onClick={() => exportLogs("pdf")}>PDF</Button>
        </form>
      </GlassCard>
      {loading ? (
        <LoadingSpinner message="Chargement..." />
      ) : (
        <TableContainer>
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1">Date</th>
                <th className="px-2 py-1">Utilisateur</th>
                <th className="px-2 py-1">Type</th>
                <th className="px-2 py-1">Module</th>
                <th className="px-2 py-1">Description</th>
                <th className="px-2 py-1">Critique</th>
                <th className="px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(logs) ? logs : []).map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {new Date(l.date_log).toLocaleString()}
                  </td>
                  <td className="border px-2 py-1">{l.utilisateurs?.nom || l.user_id || ""}</td>
                  <td className="border px-2 py-1">{l.type}</td>
                  <td className="border px-2 py-1">{l.module}</td>
                  <td className="border px-2 py-1">{l.description}</td>
                  <td className="border px-2 py-1">
                    {l.critique ? <Badge color="red">Critique</Badge> : ""}
                  </td>
                  <td className="border px-2 py-1">
                    <Button size="sm" onClick={() => setDetail(l)}>
                      Voir détails
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      )}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          <DialogDescription className="sr-only">
            Détails du log sélectionné
          </DialogDescription>
          <div className="p-4 border-b">
            <DialogTitle>Détails</DialogTitle>
          </div>
          <pre className="text-xs max-h-96 overflow-auto">
            {detail ? JSON.stringify(detail.donnees, null, 2) : ""}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
