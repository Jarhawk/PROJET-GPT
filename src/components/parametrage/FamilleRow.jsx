// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Button } from '@/components/ui/button';

export default function FamilleRow({
  famille,
  level = 0,
  onEdit,
  onDelete,
  onToggle,
  onAddSub,
}) {
  return (
    <tr>
      <td className="px-2 py-1" style={{ paddingLeft: level * 16 }}>
        {famille.nom}
      </td>
      <td className="px-2 py-1">{famille.actif ? "🟢" : "🔴"}</td>
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
          {famille.actif ? "Désactiver" : "Activer"}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onDelete(famille)}>
          Supprimer
        </Button>
      </td>
    </tr>
  );
}
