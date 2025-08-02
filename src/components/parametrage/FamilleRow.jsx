// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function FamilleRow({
  famille,
  level = 0,
  onEdit,
  onDelete,
  onToggle,
  onAddSub,
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = (famille.children || []).length > 0;
  return (
    <>
      <tr>
        <td
          className="px-2 py-1 flex items-center gap-1"
          style={{ paddingLeft: level * 16 }}
        >
          {hasChildren && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="text-xs"
            >
              {open ? '▼' : '▶'}
            </button>
          )}
          {famille.nom}
        </td>
        <td className="px-2 py-1">{famille.actif ? '🟢' : '🔴'}</td>
        <td className="px-2 py-1 flex gap-2 justify-center">
          {onAddSub && (
            <Button size="sm" onClick={() => onAddSub(famille)}>
              + Sous-famille
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => onEdit(famille)}>
            Modifier
          </Button>
          <Button size="sm" variant="outline" onClick={() => onToggle(famille)}>
            {famille.actif ? 'Désactiver' : 'Activer'}
          </Button>
          <Button
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => onDelete(famille)}
          >
            🗑 Supprimer
          </Button>
        </td>
      </tr>
      {open &&
        hasChildren &&
        famille.children
          .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
          .map((child) => (
            <FamilleRow
              key={child.id}
              famille={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              onAddSub={onAddSub}
            />
          ))}
    </>
  );
}
