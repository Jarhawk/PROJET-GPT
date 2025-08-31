// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useMenuGroupe from '@/hooks/useMenuGroupe';

export default function MenuGroupes() {
  const { menus, fetchMenusGroupes, exportExcel, archiver } = useMenuGroupe();
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [actif, setActif] = useState(true);

  useEffect(() => {
    fetchMenusGroupes({ q, statut: statut || undefined, actif });
  }, [q, statut, actif]);

  const menusList = Array.isArray(menus) ? menus : [];

  const bodyRows = [];
  for (const m of menusList) {
    bodyRows.push(
      <tr key={m.id}>
        <td>
          <Link to={`/menu-groupes/${m.id}`}>{m.nom}</Link>
        </td>
        <td>{m.statut}</td>
        <td>{m.actif ? 'oui' : 'non'}</td>
        <td>{Number(m.resume?.cout_par_personne || 0).toFixed(2)}</td>
        <td>{Number(m.prix_vente_personne || 0).toFixed(2)}</td>
        <td>{m.resume?.marge_pct ?? ''}</td>
        <td>
          <button onClick={() => exportExcel(m.id)}>Excel</button>
          <button onClick={() => archiver(m.id)}>Archiver</button>
        </td>
      </tr>
    );
  }

  return (
    <div>
      <h1>Menu groupe</h1>
      <div>
        <input
          aria-label="recherche"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          aria-label="statut"
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
        >
          <option value="">Tous</option>
          <option value="brouillon">Brouillon</option>
          <option value="valide">Validé</option>
        </select>
        <label>
          Actif
          <input
            type="checkbox"
            checked={actif}
            onChange={(e) => setActif(e.target.checked)}
          />
        </label>
        <Link to="/menu-groupes/nouveau">Nouveau</Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Statut</th>
            <th>Actif</th>
            <th>Coût/personne</th>
            <th>Prix/personne</th>
            <th>Marge %</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>{bodyRows}</tbody>
      </table>
    </div>
  );
}
