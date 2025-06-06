import GraphCost from "./GraphCost";

export default function ReportingPDF() {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold text-mamastock-gold mb-4">Rapport complet</h2>
      <GraphCost />
      {/* Tu peux ajouter d’autres stats ici plus tard */}
    </div>
  );
}
