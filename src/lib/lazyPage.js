import React from "react";

// Mappe toutes les pages .jsx (et .tsx si besoin)
const pageModules = import.meta.glob("../pages/**/*.{jsx,tsx}", { eager: false });

/**
 * Retourne un composant lazy à partir d'un chemin relatif à "src/pages".
 * Ex: lazyPage("factures/Factures.jsx")
 */
export function lazyPage(relPath) {
  // Normaliser le chemin attendu par Vite (préfixe "../pages/")
  const key = `../pages/${relPath}`;
  const loader = pageModules[key];
  if (!loader) {
    // Essai sur index.jsx (ex: "produits/index.jsx")
    const idxKey = `../pages/${relPath.replace(/\/?$/, "/index.jsx")}`;
    if (!pageModules[idxKey]) {
      // Debug visible en dev
      console.error("[lazyPage] Fichier introuvable:", key, "ou", idxKey);
      // Fallback composant pour éviter écran blanc
      return React.lazy(async () => ({
        default: () =>
          React.createElement(
            "div",
            { style: { padding: 24 } },
            `Page introuvable: ${relPath}`
          ),
      }));
    }
    return React.lazy(pageModules[idxKey]);
  }
  return React.lazy(loader);
}
