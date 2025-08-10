// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import { Form } from '@/components/ui/Form';
import { FormField } from '@/components/ui/FormField';
import { FormActions } from '@/components/ui/FormActions';
import { Input, Checkbox } from '@/components/ui/controls';

export default function ZoneForm({ zone, onSave, onCancel }) {
  const [nom, setNom] = useState(zone?.nom || '');
  const [position, setPosition] = useState(zone?.position ?? 0);
  const [actif, setActif] = useState(zone?.actif ?? true);

  useEffect(() => {
    setNom(zone?.nom || '');
    setPosition(zone?.position ?? 0);
    setActif(zone?.actif ?? true);
  }, [zone]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!nom.trim()) return;
    onSave({ nom: nom.trim(), position, actif });
  };

  return (
    <Form onSubmit={handleSubmit} title={zone ? "Modifier la zone" : "Nouvelle zone"}>
      <FormField label="Nom" htmlFor="zone-nom" required>
        <Input
          id="zone-nom"
          placeholder="Nom de la zone"
          value={nom}
          onChange={e => setNom(e.target.value)}
          required
        />
      </FormField>
      <FormField label="Position" htmlFor="zone-position">
        <Input
          id="zone-position"
          type="number"
          min={0}
          step={1}
          value={position}
          onChange={e => setPosition(parseInt(e.target.value, 10) || 0)}
        />
      </FormField>
      <FormField>
        <Checkbox
          id="zone-actif"
          label="Zone active"
          checked={actif}
          onChange={e => setActif(e.target.checked)}
        />
      </FormField>
      <FormActions onCancel={onCancel} />
    </Form>
  );
}
