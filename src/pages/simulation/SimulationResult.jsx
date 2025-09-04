// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function SimulationResult({ selection, results }) {
  return (
    <div className="text-sm text-gray-700">
      <h3 className="font-semibold mb-2">Menu simulé :</h3>
      <ul>
        {selection.map((item, idx) => (
          <li key={idx}>{item.nom} : coût {item.cout} € / prix {item.prix} €</li>
        ))}
      </ul>
      <div className="mt-4 font-semibold">
        Coût total : {results.totalCout} €<br />
        Prix total : {results.totalPrix} €<br />
        Marge brute : {results.marge} € ({results.margePourcent} %)
      </div>
    </div>
  );
}
