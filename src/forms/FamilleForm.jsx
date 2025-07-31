// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { Input } from '@/components/ui/input';

export default function FamilleForm({ famille, onSave, onCancel }) {
  const [nom, setNom] = useState(famille?.nom || '');
  const [actif, setActif] = useState(famille?.actif ?? true);

  useEffect(() => {
    setNom(famille?.nom || '');
    setActif(famille?.actif ?? true);
  }, [famille]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!nom.trim()) return;
    onSave({ nom: nom.trim(), actif });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4">
      <div>
        <label className="block text-sm mb-1 font-medium" htmlFor="famille-nom">Nom</label>
        <Input
          id="famille-nom"
          className="w-full"
          placeholder="Nom de la famille"
          value={nom}
          onChange={e => setNom(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="famille-actif"
          type="checkbox"
          className="checkbox"
          checked={actif}
          onChange={e => setActif(e.target.checked)}
        />
        <label htmlFor="famille-actif">Famille active</label>
      </div>
      <div className="flex gap-2">
        <PrimaryButton type="submit">Enregistrer</PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel}>Annuler</SecondaryButton>
      </div>
    </form>
  );
}
