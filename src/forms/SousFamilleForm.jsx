// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import { Form } from '@/components/ui/Form';
import { FormField } from '@/components/ui/FormField';
import { FormActions } from '@/components/ui/FormActions';
import { Input, Select, Checkbox } from '@/components/ui/controls';

export default function SousFamilleForm({ sousFamille, familles = [], familleId, onSave, onCancel }) {
  const [nom, setNom] = useState(sousFamille?.nom || '');
  const [famille, setFamille] = useState(familleId || sousFamille?.famille_id || '');
  const [actif, setActif] = useState(sousFamille?.actif ?? true);
  const familleOptions = Array.isArray(familles) ? familles : [];
  const optionEls = [];
  for (const f of familleOptions) {
    optionEls.push(
      <option key={f.id} value={f.id}>
        {f.nom}
      </option>
    );
  }

  useEffect(() => {
    setNom(sousFamille?.nom || '');
    setFamille(familleId || sousFamille?.famille_id || '');
    setActif(sousFamille?.actif ?? true);
  }, [sousFamille, familleId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = nom.trim();
    if (!trimmed || !famille) return;
    onSave({ nom: trimmed, actif, famille_id: famille });
  };

  return (
    <Form onSubmit={handleSubmit} title={sousFamille ? 'Modifier la sous-famille' : 'Nouvelle sous-famille'}>
      <FormField label="Nom" htmlFor="sf-nom" required>
        <Input
          id="sf-nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom de la sous-famille"
          required
        />
      </FormField>
      {familleOptions.length > 0 && (
        <FormField label="Famille" htmlFor="sf-famille" required>
          <Select
            id="sf-famille"
            value={famille}
            onChange={(e) => setFamille(e.target.value)}
            required
          >
            <option value="">Choisir</option>
            {optionEls}
          </Select>
        </FormField>
      )}
      <FormField>
        <Checkbox
          id="sf-actif"
          label="Sous-famille active"
          checked={actif}
          onChange={(e) => setActif(e.target.checked)}
        />
      </FormField>
      <FormActions onCancel={onCancel} />
    </Form>
  );
}
