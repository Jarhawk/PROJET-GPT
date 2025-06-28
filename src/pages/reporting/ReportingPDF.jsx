import GraphCost from "./GraphCost";

export default function ReportingPDF() {
  return (
    <div className="bg-glass border border-borderGlass backdrop-blur p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold text-mamastock-gold mb-4">Rapport complet</h2>
      <GraphCost />
      {/* Tu peux ajouter d’autres stats ici plus tard */}
    </div>
  );
}
