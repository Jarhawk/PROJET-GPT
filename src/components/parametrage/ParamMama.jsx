// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useMama } from '@/hooks/useMama';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

export default function ParamMama() {
  const { mama, fetchMama, updateMama } = useMama();
  const { mama_id, loading: authLoading } = useAuth();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mama_id) fetchMama();
  }, [mama_id]);
  useEffect(() => {
    setForm(mama || {});
  }, [mama]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!form.nom?.trim()) return toast.error('Nom requis');
    setLoading(true);
    try {
      await updateMama(form);
      toast.success('Établissement mis à jour !');
      setEdit(false);
    } catch (err) {
      console.error('Erreur mise à jour établissement:', err);
      toast.error('Échec de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
            <h2 className="font-bold text-xl mb-4">Établissement</h2>
      {!edit ? (
        <div>
          <div>
            <b>Nom :</b> {mama?.nom}
          </div>
          <div>
            <b>Email :</b> {mama?.email}
          </div>
          <div>
            <b>Téléphone :</b> {mama?.telephone}
          </div>
          <div>
            <b>Logo :</b>{' '}
            {mama?.logo ? (
              <img src={mama.logo} alt="logo" className="h-8" />
            ) : (
              '-'
            )}
          </div>
          <Button className="mt-4" onClick={() => setEdit(true)}>
            Modifier
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            className="form-input mb-2"
            value={form.nom || ''}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
            placeholder="Nom"
            required
          />
          <input
            className="form-input mb-2"
            value={form.email || ''}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email"
          />
          <input
            className="form-input mb-2"
            value={form.telephone || ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, telephone: e.target.value }))
            }
            placeholder="Téléphone"
          />
          {/* Ajout d'un upload logo possible ici */}
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading && <span className="loader-glass" />}
            Valider
          </Button>
          <Button
            variant="outline"
            type="button"
            className="ml-2"
            onClick={() => setEdit(false)}
            disabled={loading}
          >
            Annuler
          </Button>
        </form>
      )}
    </div>
  );
}
