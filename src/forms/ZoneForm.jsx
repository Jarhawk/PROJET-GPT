// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { Input } from '@/components/ui/input';

export default function ZoneForm({ zone, onSave, onCancel }) {
  const [nom, setNom] = useState(zone?.nom || '');
  const [actif, setActif] = useState(zone?.actif ?? true);

  useEffect(() => {
    setNom(zone?.nom || '');
    setActif(zone?.actif ?? true);
  }, [zone]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!nom.trim()) return;
    onSave({ nom: nom.trim(), actif });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4">
      <div>
        <label className="block text-sm mb-1 font-medium" htmlFor="zone-nom">Nom</label>
        <Input
          id="zone-nom"
          className="w-full"
          placeholder="Nom de la zone"
          value={nom}
          onChange={e => setNom(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="actif-checkbox"
          type="checkbox"
          className="checkbox"
          checked={actif}
          onChange={e => setActif(e.target.checked)}
        />
        <label htmlFor="actif-checkbox">Zone active</label>
      </div>
      <div className="flex gap-2">
        <PrimaryButton type="submit" className="flex items-center gap-2">Enregistrer</PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel}>Annuler</SecondaryButton>
      </div>
    </form>
  );
}
