// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/ui/GlassCard';
import AutoCompleteField from '@/components/ui/AutoCompleteField';

export default function FamilleForm({ famille, familles = [], onSave, onCancel }) {
  const [nom, setNom] = useState(famille?.nom || '');
  const [actif, setActif] = useState(famille?.actif ?? true);
  const [parentId, setParentId] = useState(famille?.famille_parent_id || '');

  useEffect(() => {
    setNom(famille?.nom || '');
    setActif(famille?.actif ?? true);
    setParentId(famille?.famille_parent_id || '');
  }, [famille]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!nom.trim()) return;
    onSave({ nom: nom.trim(), actif, famille_parent_id: parentId || null });
  };

  return (
    <GlassCard title={famille ? "Modifier la famille" : "Nouvelle famille"}>
      <form onSubmit={handleSubmit} className="space-y-3">
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
      <AutoCompleteField
        label="Famille parente"
        value={parentId}
        onChange={(val) => setParentId(val.id || '')}
        options={familles.filter(f => f.id !== famille?.id)}
      />
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
    </GlassCard>
  );
}
