// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Link, useLocation } from "react-router-dom";

export default function Breadcrumbs() {
  const location = useLocation();

  // Découpe le pathname (ex: /stock/mouvement/123)
  const pathnames = location.pathname.split("/").filter(x => x);

  return (
    <nav className="text-xs text-mamastockGold bg-mamastockBg/80 py-2 px-4 rounded-md mb-6 shadow-sm" aria-label="Breadcrumb">
      <ol className="list-none flex items-center flex-wrap gap-1">
        <li>
          <Link to="/" className="hover:underline font-semibold">
            Accueil
          </Link>
          {pathnames.length > 0 && <span className="mx-2">/</span>}
        </li>
        {pathnames.map((name, i) => {
          const routeTo = "/" + pathnames.slice(0, i + 1).join("/");
          const isLast = i === pathnames.length - 1;
          // On remplace les IDs par # (pour éviter des bread “1234567” peu lisibles)
          const label = isNaN(name) ? decodeURIComponent(name) : "#";
          return (
            <li key={routeTo} className="flex items-center">
              {!isLast ? (
                <>
                  <Link to={routeTo} className="hover:underline">
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </Link>
                  <span className="mx-2">/</span>
                </>
              ) : (
                <span className="font-bold text-mamastockGold">
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
