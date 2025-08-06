// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/ui/GlassCard';

export default function PeriodeForm({ onSave, onCancel }) {
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!debut || !fin) return;
    onSave({ date_debut: debut, date_fin: fin });
  };

  return (
    <GlassCard title="Nouvelle période">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="periode-debut" className="block text-sm mb-1 font-medium">
            Début
          </label>
          <Input
            id="periode-debut"
            type="date"
            value={debut}
            onChange={e => setDebut(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="periode-fin" className="block text-sm mb-1 font-medium">
            Fin
          </label>
          <Input
            id="periode-fin"
            type="date"
            value={fin}
            onChange={e => setFin(e.target.value)}
            required
          />
        </div>
        <div className="flex gap-2">
          <PrimaryButton type="submit">Enregistrer</PrimaryButton>
          <SecondaryButton type="button" onClick={onCancel}>
            Annuler
          </SecondaryButton>
        </div>
      </form>
    </GlassCard>
  );
}
