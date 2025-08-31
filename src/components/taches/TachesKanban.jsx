export default function TachesKanban({ taches = [] }) {
  const cols = ['a_faire', 'en_cours', 'terminee'];
  const arr = Array.isArray(taches) ? taches : [];
  const labels = {
    a_faire: 'À faire',
    en_cours: 'En cours',
    terminee: 'Terminée',
  };
  const columns = [];
  for (const col of cols) {
    const tasks = [];
    for (const t of arr) {
      if (t.statut === col) {
        tasks.push(
          <li key={t.id} className="bg-white/5 rounded p-2 text-sm">
            {t.titre}
          </li>
        );
      }
    }
    columns.push(
      <div key={col} className="flex-1 bg-white/10 p-2 rounded">
        <h3 className="font-bold mb-2 text-center">{labels[col]}</h3>
        <ul className="space-y-2">{tasks}</ul>
      </div>
    );
  }
  return <div className="flex gap-4">{columns}</div>;
}
