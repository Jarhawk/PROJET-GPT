import { useReporting } from "@/hooks/useReporting";

export default function Reporting() {
  const { data: rapports, loading, error } = useReporting();

  if (loading) {
    return (
      <div className="p-6 text-white text-center">
        ⏳ Chargement des rapports d'analyse...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 text-center">
        ❌ Erreur lors du chargement : {error.message}
      </div>
    );
  }

  if (!rapports || rapports.length === 0) {
    return (
      <div className="p-6 text-gray-300 text-center">
        📭 Aucun rapport disponible.
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4 text-mamastock-gold">Rapports d'analyse</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rapports.map((rpt) => (
          <div
            key={rpt.id}
            className="bg-white/10 border border-mamastock-gold rounded-xl p-4 hover:bg-white/20 transition"
          >
            <h2 className="text-lg font-semibold">{rpt.titre}</h2>
            <p className="text-sm text-gray-300">{rpt.periode}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
