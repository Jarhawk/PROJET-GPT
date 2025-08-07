// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import useMenusGroupes from '@/hooks/useMenusGroupes';

export default function MenuGroupe() {
  const { menus, fetchMenusGroupes } = useMenusGroupes();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMenusGroupes();
  }, []);

  const filtered = menus.filter(m => filter === 'all' || m.statut === filter);

  return (
    <div>
      <h1>Menus groupes</h1>
      <select aria-label="filtre" value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="all">Tous</option>
        <option value="valide">validé</option>
        <option value="brouillon">brouillon</option>
      </select>
      <ul>
        {filtered.map(m => (
          <li key={m.id}>
            {m.nom} - {Number(m.cout_total || 0).toFixed(2)}€ - marge {Number(m.marge || 0).toFixed(2)}%
          </li>
        ))}
      </ul>
      <button>Créer une formule</button>
    </div>
  );
}
