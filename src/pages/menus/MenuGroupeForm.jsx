// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import useMenuGroupe from '@/hooks/useMenuGroupe';
import { useFiches } from '@/hooks/useFiches';

export default function MenuGroupeForm() {
  const { createMenuGroupe, addLigne, exportPdf, exportExcel } = useMenuGroupe();
  const { fiches } = useFiches();
  const fichesList = Array.isArray(fiches) ? fiches : [];
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState(0);
  const [items, setItems] = useState([]); // {categorie, fiche, portions}

  function addFiche() {
    if (fichesList.length === 0) return;
    const fiche = fichesList[0];
    setItems([...items, { categorie: 'entree', fiche, portions: 1 }]);
  }

  function updatePortion(index, value) {
    const copy = [...items];
    copy[index].portions = Number(value) || 0;
    setItems(copy);
  }

  function computeStats() {
    const cout = items.reduce((sum, i) => sum + (Number(i.fiche.cout_unitaire) || 0) * i.portions, 0);
    const marge = Number(prix || 0) - cout;
    const marge_pct = prix > 0 ? (marge / prix) * 100 : 0;
    return { cout, marge, marge_pct };
  }

  async function handleSave() {
    const menu = await createMenuGroupe({ nom, prix_vente_personne: prix });
    if (menu?.id) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await addLigne(menu.id, {
          categorie: it.categorie,
          fiche_id: it.fiche.id,
          portions_par_personne: it.portions,
          position: i,
        });
      }
    }
  }

  const stats = computeStats();

  return (
    <div>
      <h1>Formule groupe</h1>
      <input aria-label="nom" value={nom} onChange={e => setNom(e.target.value)} />
      <input aria-label="prix" type="number" value={prix} onChange={e => setPrix(Number(e.target.value) || 0)} />
      <button onClick={addFiche}>Ajouter fiche</button>
      <ul>
        {(() => {
          const rows = [];
          for (let idx = 0; idx < items.length; idx++) {
            const i = items[idx];
            rows.push(
              <li key={idx}>
                {i.categorie} - {i.fiche.nom}
                <input
                  aria-label="portion"
                  type="number"
                  value={i.portions}
                  onChange={e => updatePortion(idx, e.target.value)}
                />
              </li>
            );
          }
          return rows;
        })()}
      </ul>
      <div>Coût total: {stats.cout.toFixed(2)} €</div>
      <div>Marge: {stats.marge.toFixed(2)} € ({stats.marge_pct.toFixed(2)}%)</div>
      <button onClick={handleSave}>Enregistrer</button>
      <button onClick={() => exportPdf()}>Exporter PDF</button>
      <button onClick={() => exportExcel()}>Exporter Excel</button>
    </div>
  );
}
