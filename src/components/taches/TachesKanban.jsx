export default function TachesKanban({ taches = [] }) {
  const cols = ['a_faire', 'en_cours', 'terminee'];
  const labels = {
    a_faire: 'À faire',
    en_cours: 'En cours',
    terminee: 'Terminée',
  };
  return (
    <div className="flex gap-4">
      {cols.map(col => (
        <div key={col} className="flex-1 bg-white/10 p-2 rounded">
          <h3 className="font-bold mb-2 text-center">{labels[col]}</h3>
          <ul className="space-y-2">
            {taches.filter(t => t.statut === col).map(t => (
              <li key={t.id} className="bg-white/5 rounded p-2 text-sm">
                {t.titre}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
