// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

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
        <label className="block text-sm mb-1 font-medium">Nom</label>
        <input
          className="input w-full"
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
        <Button type="submit">Enregistrer</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
