export default function FicheExportView({ fiches = [] }) {
  return (
    <div className="p-6 text-black">
      {fiches.map((fiche, i) => (
        <div key={fiche.id} className={i > 0 ? 'page-break mt-6' : ''}>
          <h1 className="text-2xl font-bold mb-2">{fiche.nom}</h1>
          {fiche.image && (
            <img src={fiche.image} alt={fiche.nom} className="max-w-xs mb-2" />
          )}
          <table className="w-full text-sm border mb-4">
            <thead>
              <tr className="bg-white/10">
                <th className="border px-2 py-1">Ingrédient</th>
                <th className="border px-2 py-1">Qté</th>
                <th className="border px-2 py-1">Unité</th>
                <th className="border px-2 py-1">Prix</th>
              </tr>
            </thead>
            <tbody>
              {fiche.lignes?.map((l) => (
                <tr key={l.id}>
                  <td className="border px-2 py-1">{l.nom}</td>
                  <td className="border px-2 py-1 text-right">{l.quantite}</td>
                  <td className="border px-2 py-1">{l.unite}</td>
                  <td className="border px-2 py-1 text-right">{l.prix}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right font-semibold">
            Coût portion : {fiche.cout_portion} €
          </div>
        </div>
      ))}
    </div>
  );
}
