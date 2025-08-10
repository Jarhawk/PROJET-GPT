// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { Form } from '@/components/ui/Form';
import { FormField } from '@/components/ui/FormField';
import { FormActions } from '@/components/ui/FormActions';
import { Input } from '@/components/ui/controls';

export default function PeriodeForm({ onSave, onCancel }) {
  const [debut, setDebut] = useState('');
  const [fin, setFin] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!debut || !fin) return;
    onSave({ debut, fin });
  };

  return (
    <Form onSubmit={handleSubmit} title="Nouvelle période">
      <FormField label="Début" htmlFor="periode-debut" required>
        <Input
          id="periode-debut"
          type="date"
          value={debut}
          onChange={e => setDebut(e.target.value)}
          required
        />
      </FormField>
      <FormField label="Fin" htmlFor="periode-fin" required>
        <Input
          id="periode-fin"
          type="date"
          value={fin}
          onChange={e => setFin(e.target.value)}
          required
        />
      </FormField>
      <FormActions onCancel={onCancel} />
    </Form>
  );
}
