import { useState } from 'react';
import { useGadgets } from '@/hooks/useGadgets';
import InputField from '@/components/ui/InputField';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import GlassCard from '@/components/ui/GlassCard';

export default function GadgetConfigForm({ gadget, onSave, onCancel }) {
  const editing = !!gadget;
  const [nom, setNom] = useState(gadget?.nom || '');
  const [type, setType] = useState(gadget?.type || 'indicator');
  const [config, setConfig] = useState(
    JSON.stringify(gadget?.config || {}, null, 2)
  );
  const { addGadget, updateGadget } = useGadgets();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    let json;
    try {
      json = config ? JSON.parse(config) : {};
    } catch {
      toast.error('JSON invalide');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await updateGadget(gadget.id, {
          nom,
          type,
          config: json,
        });
      } else {
        await addGadget({ nom, type, config: json });
      }
      onSave?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard title={editing ? 'Modifier le gadget' : 'Nouveau gadget'}>
      <form onSubmit={handleSubmit} className="space-y-4">
      <InputField label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      <div>
        <label className="block text-sm text-white mb-1">Type</label>
        <select className="form-select w-full" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="indicator">Indicateur</option>
          <option value="line">Line</option>
          <option value="bar">Bar</option>
          <option value="pie">Pie</option>
          <option value="list">Liste</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-white mb-1">Configuration (JSON)</label>
        <textarea
          className="form-textarea w-full font-mono"
          rows="4"
          value={config}
          onChange={(e) => setConfig(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel}>Annuler</Button>
        <Button type="submit" className="flex items-center gap-2" disabled={saving}>
          {saving && <span className="loader-glass" />}
          {editing ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </div>
      </form>
    </GlassCard>
  );
}
