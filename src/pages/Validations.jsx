// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import useValidations from '@/hooks/useValidations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import GlassCard from '@/components/ui/GlassCard';
import TableContainer from '@/components/ui/TableContainer';

export default function Validations() {
  const { isAdmin, mama_id } = useAuth();
  const validations = useValidations();
  const [form, setForm] = useState({ module: '', entity_id: '', action: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mama_id) validations.fetchRequests();
  }, [validations.fetchRequests, mama_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    await validations.addRequest(form);
    if (validations.error) {
      toast.error(validations.error);
    } else {
      toast.success('Demande envoyée');
      setForm({ module: '', entity_id: '', action: '' });
    }
    setSaving(false);
  };

  const handleUpdate = async (id, status) => {
    if (saving) return;
    setSaving(true);
    await validations.updateStatus(id, status);
    if (validations.error) {
      toast.error(validations.error);
    } else {
      toast.success('Statut mis à jour');
    }
    setSaving(false);
  };

    const { items, loading, error } = validations;
    const list = Array.isArray(items) ? items : [];
    const rows = [];
    for (const v of list) {
      rows.push(
        <tr key={v.id} className="border-t">
          <td className="px-2 py-1">{v.module}</td>
          <td className="px-2 py-1">{v.action}</td>
          <td className="px-2 py-1">{v.status}</td>
          {isAdmin && (
            <td className="px-2 py-1 space-x-1 text-right">
              <Button
                size="sm"
                disabled={saving}
                onClick={() => handleUpdate(v.id, 'approved')}
              >
                OK
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={saving}
                onClick={() => handleUpdate(v.id, 'rejected')}
              >
                Refus
              </Button>
            </td>
          )}
        </tr>
      );
    }

  if (loading) return <LoadingSpinner message="Chargement..." />;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto text-sm">
            <h1 className="text-2xl font-bold mb-4">Validations</h1>
      <GlassCard title="Nouvelle demande" className="mb-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap gap-2 items-end"
        >
          <input
            className="form-input"
            placeholder="Module"
            value={form.module}
            onChange={(e) => setForm((f) => ({ ...f, module: e.target.value }))}
            required
          />
          <input
            className="form-input"
            placeholder="Action"
            value={form.action}
            onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
            required
          />
          <input
            className="form-input"
            placeholder="Entité"
            value={form.entity_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, entity_id: e.target.value }))
            }
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Envoi…' : 'Demander'}
          </Button>
        </form>
      </GlassCard>
      <TableContainer className="mt-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1">Module</th>
              <th className="px-2 py-1">Action</th>
              <th className="px-2 py-1">Statut</th>
              {isAdmin && <th className="px-2 py-1"></th>}
            </tr>
          </thead>
            <tbody>{rows}</tbody>
          </table>
        </TableContainer>
      </div>
    );
  }
