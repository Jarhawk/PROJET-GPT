// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import SousFamilleRow from './SousFamilleRow';
import SousFamilleForm from '@/forms/SousFamilleForm.jsx';

export default function FamilleRow({
  famille,
  onEdit,
  onDelete,
  onToggle,
  onAddSousFamille,
  onUpdateSousFamille,
  onDeleteSousFamille,
  onToggleSousFamille,
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const hasActiveSous = famille.sous_familles?.some((sf) => sf.actif);

  return (
    <>
      <tr className="bg-white/5">
        <td className="px-2 py-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mr-2 text-xs"
          >
            {open ? '▼' : '▶'}
          </button>
          {famille.nom}
        </td>
        <td className="px-2 py-1 text-center">{famille.actif ? '🟢' : '🔴'}</td>
        <td className="px-2 py-1">
          <div className="flex gap-2 justify-center flex-wrap">
            <Button size="sm" onClick={() => setAdding(true)}>
              + Sous-famille
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onEdit(famille)}>
              Modifier
            </Button>
            <Button size="sm" variant="outline" onClick={() => onToggle(famille)}>
              {famille.actif ? 'Désactiver' : 'Activer'}
            </Button>
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => onDelete(famille.id)}
              disabled={hasActiveSous}
            >
              🗑 Supprimer
            </Button>
          </div>
        </td>
      </tr>
      {open && (
        <>
          {famille.sous_familles?.map((sf) => (
            <SousFamilleRow
              key={sf.id}
              sousFamille={sf}
              onUpdate={onUpdateSousFamille}
              onDelete={onDeleteSousFamille}
              onToggle={onToggleSousFamille}
            />
          ))}
          {adding && (
            <tr>
              <td colSpan={3} className="px-2 py-1">
                <SousFamilleForm
                  familleId={famille.id}
                  onSave={async (data) => {
                    await onAddSousFamille(famille.id, data);
                    setAdding(false);
                  }}
                  onCancel={() => setAdding(false)}
                />
              </td>
            </tr>
          )}
          {(!famille.sous_familles || famille.sous_familles.length === 0) && !adding && (
            <tr>
              <td colSpan={3} className="px-2 py-1 pl-6 text-sm text-muted-foreground">
                Aucune sous-famille
              </td>
            </tr>
          )}
        </>
      )}
    </>
  );
}
