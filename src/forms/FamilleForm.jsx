// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import { Form } from '@/components/ui/Form';
import { FormField } from '@/components/ui/FormField';
import { FormActions } from '@/components/ui/FormActions';
import { Input, Checkbox } from '@/components/ui/controls';
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
    <Form onSubmit={handleSubmit} title={famille ? "Modifier la famille" : "Nouvelle famille"}>
      <FormField label="Nom" htmlFor="famille-nom" required>
        <Input
          id="famille-nom"
          placeholder="Nom de la famille"
          value={nom}
          onChange={e => setNom(e.target.value)}
          required
        />
      </FormField>
      <FormField>
        <Checkbox
          id="famille-actif"
          label="Famille active"
          checked={actif}
          onChange={e => setActif(e.target.checked)}
        />
      </FormField>
      <FormActions onCancel={onCancel} />
    </Form>
  );
}
