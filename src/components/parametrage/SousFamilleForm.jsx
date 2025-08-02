// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SousFamilleForm({ initialData = { nom: '', actif: true }, onSubmit, onCancel }) {
  const [nom, setNom] = useState(initialData.nom ?? '');
  const [actif, setActif] = useState(initialData.actif ?? true);
  const [error, setError] = useState('');

  useEffect(() => {
    setNom(initialData.nom ?? '');
    setActif(initialData.actif ?? true);
  }, [initialData.nom, initialData.actif]);

  const handleSubmit = e => {
    e.preventDefault();
    const trimmedNom = nom.trim();
    if (!trimmedNom) {
      setError('Le nom est requis');
      return;
    }
    setError('');
    onSubmit({ nom: trimmedNom, actif });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        name="nom"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Nom de la sous-famille"
        aria-invalid={error ? 'true' : undefined}
        required
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="actif"
          checked={actif}
          onChange={e => setActif(e.target.checked)}
        />
        Actif
      </label>
      <div className="flex gap-2 justify-end">
        <Button type="submit">Enregistrer</Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
