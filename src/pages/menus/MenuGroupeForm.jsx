// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import useMenusGroupes from '@/hooks/useMenusGroupes';
import { useFiches } from '@/hooks/useFiches';

export default function MenuGroupeForm() {
  const { createOrUpdateMenu, calculateMenuStats, exportMenuPDF, exportMenuExcel } = useMenusGroupes();
  const { fiches } = useFiches();
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState(0);
  const [items, setItems] = useState([]); // {categorie, fiche}

  function addFiche() {
    if (fiches.length === 0) return;
    const fiche = fiches[0];
    if (items.some(i => i.fiche.id === fiche.id)) return;
    setItems([...items, { categorie: 'Entrée', fiche }]);
  }

  const stats = calculateMenuStats({
    prix_vente: prix,
    fiches: items.map(i => ({ cout: i.fiche.cout_unitaire })),
  });

  function handleSave() {
    createOrUpdateMenu({
      nom,
      prix_vente: prix,
      fiches: items.map(i => ({ fiche_id: i.fiche.id, categorie: i.categorie })),
    });
  }

  return (
    <div>
      <h1>Formule groupe</h1>
      <input aria-label="nom" value={nom} onChange={e => setNom(e.target.value)} />
      <input aria-label="prix" type="number" value={prix} onChange={e => setPrix(Number(e.target.value) || 0)} />
      <button onClick={addFiche}>Ajouter fiche</button>
      <ul>
        {items.map(i => (
          <li key={i.fiche.id}>{i.categorie} - {i.fiche.nom}</li>
        ))}
      </ul>
      <div>Coût total: {stats.totalCost.toFixed(2)} €</div>
      <div>Marge: {stats.marge.toFixed(2)} €</div>
      {stats.taux_food_cost > 70 && <div role="alert">Marge faible</div>}
      <button onClick={handleSave}>Enregistrer</button>
      <button onClick={() => exportMenuPDF({ nom, items })}>Exporter PDF</button>
      <button onClick={() => exportMenuExcel({ nom, items })}>Exporter Excel</button>
    </div>
  );
}
