// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import { Form } from '@/components/ui/Form';
import { FormField } from '@/components/ui/FormField';
import { FormActions } from '@/components/ui/FormActions';
import { Input, Checkbox } from '@/components/ui/controls';

export default function UniteForm({ unite, onSave, onCancel }) {
  const [nom, setNom] = useState(unite?.nom || '');
  const [actif, setActif] = useState(unite?.actif ?? true);

  useEffect(() => {
    setNom(unite?.nom || '');
    setActif(unite?.actif ?? true);
  }, [unite]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!nom.trim()) return;
    onSave({ nom: nom.trim(), actif });
  };

  return (
    <Form onSubmit={handleSubmit} title={unite ? "Modifier l'unité" : "Nouvelle unité"}>
      <FormField label="Nom" htmlFor="unite-nom" required>
        <Input
          id="unite-nom"
          placeholder="Nom de l’unité"
          value={nom}
          onChange={e => setNom(e.target.value)}
          required
        />
      </FormField>
      <FormField>
        <Checkbox
          id="unite-actif"
          label="Unité active"
          checked={actif}
          onChange={e => setActif(e.target.checked)}
        />
      </FormField>
      <FormActions onCancel={onCancel} />
    </Form>
  );
}
