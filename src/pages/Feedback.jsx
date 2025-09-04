// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useFeedback } from "@/hooks/useFeedback";
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Input } from "@/components/ui/input";
import TableContainer from "@/components/ui/TableContainer";
import GlassCard from "@/components/ui/GlassCard";
import { toast } from 'sonner';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Feedback() {
  const { mama_id, loading: authLoading } = useAuth();
  const { items, fetchFeedback, addFeedback, loading, error } = useFeedback();
  const [form, setForm] = useState({ module: "", message: "", urgence: "normal" });

  useEffect(() => {
    if (!authLoading && mama_id) fetchFeedback();
  }, [authLoading, mama_id, fetchFeedback]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await addFeedback(form);
    if (error) toast.error(error.message || error);
    else toast.success("Feedback envoyé !");
    setForm({ module: "", message: "", urgence: "normal" });
  };

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 container mx-auto text-sm space-y-6">
            <h1 className="text-2xl font-bold">Feedback utilisateur</h1>
      <GlassCard title="Envoyer un message" className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            className="w-full"
            placeholder="Module concerné"
            value={form.module}
            onChange={(e) => setForm((f) => ({ ...f, module: e.target.value }))}
            required
          />
        <textarea
          className="input w-full h-24"
          placeholder="Votre message"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          required
        />
        <label htmlFor="urgence" className="label">Urgence</label>
        <select
          id="urgence"
          aria-label="Urgence"
          className="input bg-white text-gray-900 w-full"
          value={form.urgence}
          onChange={(e) => setForm((f) => ({ ...f, urgence: e.target.value }))}
        >
          <option value="faible">Faible</option>
          <option value="normal">Normal</option>
          <option value="elevee">Élevée</option>
        </select>
        <PrimaryButton type="submit" disabled={loading} className="flex items-center gap-2">
          {loading && <span className="loader-glass" />}Envoyer
        </PrimaryButton>
        </form>
      </GlassCard>
      {error && <div className="text-red-600">{error}</div>}
      <TableContainer>
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Module</th>
              <th className="px-2 py-1">Urgence</th>
              <th className="px-2 py-1">Message</th>
            </tr>
          </thead>
          <tbody>
            {items.map((fb) => (
              <tr key={fb.id} className="border-t">
                <td className="px-2 py-1 whitespace-nowrap">
                  {new Date(fb.created_at).toLocaleDateString()}
                </td>
                <td className="px-2 py-1">{fb.module}</td>
                <td className="px-2 py-1">{fb.urgence}</td>
                <td className="px-2 py-1">{fb.message}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="4" className="py-4 text-center text-gray-500">
                  Aucun feedback pour le moment
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}

