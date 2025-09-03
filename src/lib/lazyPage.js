import React from "react";

// Mappe toutes les pages .jsx (et .tsx si besoin)
const pageModules = import.meta.glob("../pages/**/*.{jsx,tsx}", { eager: false });

function resolveModule(relPath) {
  const key = `../pages/${relPath}`;
  if (pageModules[key]) return pageModules[key];
  const candidates = [
    `../pages/${relPath.replace(/\/?$/, "/index.jsx")}`,
    `../pages/${relPath.replace(/\/?$/, "/index.tsx")}`,
  ];
  for (const c of candidates) {
    if (pageModules[c]) return pageModules[c];
  }
  return null;
}

export function pageExists(relPath) {
  return Boolean(resolveModule(relPath));
}

/**
 * Retourne un composant lazy à partir d'un chemin relatif à "src/pages".
 * Ex: lazyPage("factures/Factures.jsx")
 */
export function lazyPage(relPath) {
  const loader = resolveModule(relPath);
  if (!loader) {
    // Debug visible en dev
    console.error("[lazyPage] Fichier introuvable:", relPath);
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
  return React.lazy(loader);
}
