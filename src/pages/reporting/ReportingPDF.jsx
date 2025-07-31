// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import GraphCost from "./GraphCost";

export default function ReportingPDF() {
  return (
    <div className="bg-white/10 border border-white/20 backdrop-blur-xl p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold text-mamastock-gold mb-4">Rapport complet</h2>
      <GraphCost />
      {/* Tu peux ajouter d’autres stats ici plus tard */}
    </div>
  );
}
