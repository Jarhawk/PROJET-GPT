// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { Input } from '@/components/ui/input';
import { useApiKeys } from '@/hooks/useApiKeys';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import TableContainer from '@/components/ui/TableContainer';
import GlassCard from '@/components/ui/GlassCard';

export default function APIKeys() {
  const { keys, loading, listKeys, createKey, revokeKey } = useApiKeys();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', scopes: '', role: '', expiration: '' });

  useEffect(() => { listKeys(); }, [listKeys]);

  const handleSubmit = async e => {
    e.preventDefault();
    const { error } = await createKey(form);
    if (error) toast.error(error.message || 'Erreur');
    else {
      toast.success('Clé créée');
      setForm({ name: '', scopes: '', role: '', expiration: '' });
      setFormOpen(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Clés API</h1>
      <PrimaryButton onClick={() => setFormOpen(o => !o)}>Nouvelle clé</PrimaryButton>
      {formOpen && (
        <GlassCard title="Nouvelle clé" className="mt-4">
          <form className="space-y-2" onSubmit={handleSubmit}>
          <div>
            <label>Nom</label>
            <Input className="w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label>Scopes</label>
            <Input className="w-full" value={form.scopes} onChange={e => setForm(f => ({ ...f, scopes: e.target.value }))} required />
          </div>
          <div>
            <label>Rôle</label>
            <Input className="w-full" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          </div>
          <div>
            <label>Expiration</label>
            <Input type="date" className="" value={form.expiration} onChange={e => setForm(f => ({ ...f, expiration: e.target.value }))} />
          </div>
          <PrimaryButton type="submit">Créer</PrimaryButton>
          </form>
        </GlassCard>
      )}
      <TableContainer className="mt-6">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Scopes</th>
              <th>Rôle</th>
              <th>Date création</th>
              <th>Expiration</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const rows = [];
              const list = Array.isArray(keys) ? keys : [];
              for (let i = 0; i < list.length; i++) {
                const k = list[i];
                rows.push(
                  <tr key={k.id}>
                    <td className="border px-2 py-1">{k.name}</td>
                    <td className="border px-2 py-1">{k.scopes}</td>
                    <td className="border px-2 py-1">{k.role}</td>
                    <td className="border px-2 py-1">{k.created_at?.slice(0,16).replace('T',' ')}</td>
                    <td className="border px-2 py-1">{k.expiration?.slice(0,10) || '-'}</td>
                    <td className="border px-2 py-1">{k.revoked ? 'Révoquée' : 'Active'}</td>
                    <td className="border px-2 py-1">
                      {!k.revoked && (
                        <SecondaryButton size="sm" onClick={() => revokeKey(k.id)}>
                          Révoquer
                        </SecondaryButton>
                      )}
                    </td>
                  </tr>
                );
              }
              if (rows.length === 0 && !loading) {
                rows.push(
                  <tr key="empty">
                    <td colSpan={7} className="py-4 text-gray-500">Aucune clé</td>
                  </tr>
                );
              }
              if (loading) {
                rows.push(
                  <tr key="loading">
                    <td colSpan={7} className="py-4">
                      <LoadingSpinner message="Chargement…" />
                    </td>
                  </tr>
                );
              }
              return rows;
            })()}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
