// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SousFamilleForm({ initialData = { nom: '', actif: true }, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialData);

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  const handleChange = e => {
    const { name, type, checked, value } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.nom.trim()) return;
    onSubmit({ nom: form.nom.trim(), actif: form.actif });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        name="nom"
        value={form.nom}
        onChange={handleChange}
        placeholder="Nom de la sous-famille"
        required
      />
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="actif"
          checked={form.actif}
          onChange={handleChange}
        />
        Actif
      </label>
      <div className="flex gap-2 justify-end">
        <Button type="submit">Enregistrer</Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
