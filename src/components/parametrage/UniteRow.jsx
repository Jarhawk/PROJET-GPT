// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Button } from '@/components/ui/button';

export default function UniteRow({ unite, onEdit, onDelete, onToggle }) {
  return (
    <tr>
      <td className="px-2 py-1">{unite.nom}</td>
      <td className="px-2 py-1">
        <span className="transition-colors duration-200">
          {unite.actif ? '🟢' : '🔴'}
        </span>
      </td>
      <td className="px-2 py-1 flex gap-2 justify-center">
        <Button size="sm" variant="secondary" onClick={() => onEdit(unite)}>
          Modifier
        </Button>
        <Button size="sm" variant="outline" onClick={() => onToggle(unite)}>
          {unite.actif ? '🔴 Désactiver' : '🟢 Activer'}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(unite)}>
          Supprimer
        </Button>
      </td>
    </tr>
  );
}
