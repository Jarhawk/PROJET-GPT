// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import SousFamilleForm from './SousFamilleForm';

export default function SousFamilleRow({ sousFamille, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr>
        <td colSpan={3} className="px-2 py-1">
          <SousFamilleForm
            initialData={sousFamille}
            onSubmit={async data => {
              await onUpdate(sousFamille.id, data);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-2 py-1">{sousFamille.nom}</td>
      <td className="px-2 py-1 text-center">{sousFamille.actif ? '✔️' : '❌'}</td>
      <td className="px-2 py-1">
        <div className="flex gap-2 justify-center">
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            Modifier
          </Button>
          <Button
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => onDelete(sousFamille)}
          >
            🗑
          </Button>
        </div>
      </td>
    </tr>
  );
}
