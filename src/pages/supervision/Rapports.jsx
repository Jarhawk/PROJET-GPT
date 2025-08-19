// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useLogs } from "@/hooks/useLogs";
import supabase from '@/lib/supabaseClient';
import GlassCard from "@/components/ui/GlassCard";
import TableContainer from "@/components/ui/TableContainer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/SmartDialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const MODULES = ["produits", "factures", "inventaire"];
const FORMATS = ["pdf", "excel"];

export default function Rapports() {
  const { mama_id, loading: authLoading } = useAuth();
  const { rapports, fetchRapports, downloadRapport } = useLogs();
  const [filters, setFilters] = useState({ module: "", type: "", start: "", end: "" });
  const [open, setOpen] = useState(false);
  const [gen, setGen] = useState({ module: "", type: "pdf", start: "", end: "" });

  const load = useCallback(async () => {
    await fetchRapports({
      module: filters.module || undefined,
      type: filters.type || undefined,
      start: filters.start || undefined,
      end: filters.end || undefined,
    });
  }, [fetchRapports, filters]);

  useEffect(() => {
    if (!authLoading && mama_id) load();
  }, [authLoading, mama_id, load]);

  const handleSubmit = (e) => {
    e.preventDefault();
    load();
  };

  async function handleGenerate(e) {
    e.preventDefault();
    await supabase.from("rapports_generes").insert({
      mama_id,
      module: gen.module,
      type: gen.type,
      periode_debut: gen.start || null,
      periode_fin: gen.end || null,
      chemin_fichier: "",
    });
    setOpen(false);
    load();
  }

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  return (
    <div className="p-6 container mx-auto space-y-4 text-sm">
      <h1 className="text-2xl font-bold">Rapports générés</h1>
      <GlassCard title="Filtres" className="mb-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <Select value={filters.module} onChange={(e) => setFilters({ ...filters, module: e.target.value })}>
            <option value="">Module</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">Format</option>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
          <Input type="date" value={filters.start} onChange={(e) => setFilters({ ...filters, start: e.target.value })} />
          <Input type="date" value={filters.end} onChange={(e) => setFilters({ ...filters, end: e.target.value })} />
          <PrimaryButton type="submit">Filtrer</PrimaryButton>
          <Button type="button" onClick={() => setOpen(true)}>
            Générer rapport
          </Button>
        </form>
      </GlassCard>
      <TableContainer>
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1">Module</th>
              <th className="px-2 py-1">Format</th>
              <th className="px-2 py-1">Période</th>
              <th className="px-2 py-1">Généré le</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rapports.map((r) => (
              <tr key={r.id}>
                <td className="border px-2 py-1">{r.module}</td>
                <td className="border px-2 py-1">{r.type}</td>
                <td className="border px-2 py-1">
                  {r.periode_debut || ""} - {r.periode_fin || ""}
                </td>
                <td className="border px-2 py-1">
                  {new Date(r.date_generation).toLocaleString()}
                </td>
                <td className="border px-2 py-1">
                  <Button size="sm" onClick={() => downloadRapport(r.id)}>
                    Télécharger
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <div className="p-4 border-b">
            <DialogTitle>Nouveau rapport</DialogTitle>
          </div>
          <form onSubmit={handleGenerate} className="flex flex-col gap-2">
            <Select value={gen.module} onChange={(e) => setGen({ ...gen, module: e.target.value })}>
              <option value="">Module</option>
              {MODULES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
            <Select value={gen.type} onChange={(e) => setGen({ ...gen, type: e.target.value })}>
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
            <Input type="date" value={gen.start} onChange={(e) => setGen({ ...gen, start: e.target.value })} />
            <Input type="date" value={gen.end} onChange={(e) => setGen({ ...gen, end: e.target.value })} />
            <PrimaryButton type="submit">Générer</PrimaryButton>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
