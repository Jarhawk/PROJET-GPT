// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Button } from '@/components/ui/button';

export default function ZoneRow({ zone, onEdit, onDelete, onToggle }) {
  return (
    <tr>
      <td className="px-2 py-1">{zone.nom}</td>
      <td className="px-2 py-1">{zone.actif ? '🟢' : '🔴'}</td>
      <td className="px-2 py-1">{new Date(zone.created_at).toLocaleDateString()}</td>
      <td className="px-2 py-1 flex gap-2 justify-center">
        <Button size="sm" variant="secondary" onClick={() => onEdit(zone)}>
          Modifier
        </Button>
        <Button size="sm" variant="outline" onClick={() => onToggle(zone)}>
          {zone.actif ? 'Désactiver' : 'Activer'}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(zone)}>
          Supprimer
        </Button>
      </td>
    </tr>
  );
}
