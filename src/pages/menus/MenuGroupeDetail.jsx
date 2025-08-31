// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useMenuGroupe from '@/hooks/useMenuGroupe';

export default function MenuGroupeDetail() {
  const { id } = useParams();
  const { fetchMenuGroupeById, exportPdf, exportExcel } = useMenuGroupe();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchMenuGroupeById(id).then(setData);
  }, [id]);

  if (!data) return <div>Chargement...</div>;

  const { menu, lignes, resume } = data;
  const lignesList = Array.isArray(lignes) ? lignes : [];
  const rows = [];
  for (const l of lignesList) {
    rows.push(
      <li key={l.id}>
        {l.categorie} - {l.fiche?.nom} ({l.portions_par_personne})
      </li>
    );
  }

  return (
    <div>
      <h1>{menu.nom}</h1>
      <ul>{rows}</ul>
      <div>
        Coût/personne: {Number(resume?.cout_par_personne || 0).toFixed(2)}€
      </div>
      <div>
        Marge: {Number(resume?.marge_par_personne || 0).toFixed(2)}€ (
        {resume?.marge_pct ?? ''}%)
      </div>
      <button onClick={() => exportPdf(id)}>PDF</button>
      <button onClick={() => exportExcel(id)}>Excel</button>
    </div>
  );
}
