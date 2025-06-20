import { Link } from "react-router-dom";

export default function MobileAccueil() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mamastock-bg text-white px-4 animate-fade-in">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h2 className="text-2xl font-bold text-mamastockGold">📱 Menu Mobile</h2>

        <div className="flex flex-col gap-4">
          <Link
            to="/mobile/inventaire"
            className="bg-mamastock-gold hover:bg-mamastock-gold-hover transition text-white py-3 px-6 rounded-lg shadow-md text-lg font-semibold"
          >
            📦 Inventaire
          </Link>
          <Link
            to="/mobile/requisition"
            className="bg-mamastock-gold hover:bg-mamastock-gold-hover transition text-white py-3 px-6 rounded-lg shadow-md text-lg font-semibold"
          >
            🔄 Réquisition
          </Link>
          <Link
            to="/mobile/mouvement"
            className="bg-mamastock-gold hover:bg-mamastock-gold-hover transition text-white py-3 px-6 rounded-lg shadow-md text-lg font-semibold"
          >
            🚚 Mouvement
          </Link>
        </div>
      </div>
    </div>
  );
}
