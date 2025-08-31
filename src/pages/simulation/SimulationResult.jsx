// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function SimulationResult({ selection, results }) {
  return (
    <div className="text-sm text-gray-700">
      <h3 className="font-semibold mb-2">Menu simulé :</h3>
      <ul>
        {(() => {
          const items = [];
          const list = Array.isArray(selection) ? selection : [];
          for (let i = 0; i < list.length; i++) {
            const item = list[i];
            items.push(
              <li key={i}>
                {item.nom} : coût {item.cout} € / prix {item.prix} €
              </li>
            );
          }
          return items;
        })()}
      </ul>
      <div className="mt-4 font-semibold">
        Coût total : {results.totalCout} €<br />
        Prix total : {results.totalPrix} €<br />
        Marge brute : {results.marge} € ({results.margePourcent} %)
      </div>
    </div>
  );
}
