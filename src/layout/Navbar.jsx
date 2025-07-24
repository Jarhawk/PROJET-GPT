// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import useAuth from "@/hooks/useAuth";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import LanguageSelector from "@/components/ui/LanguageSelector";

export default function Navbar() {
  const { t } = useTranslation();
  const { session, role, mama_id } = useAuth();
  const [term, setTerm] = useState("");
  const { results, search } = useGlobalSearch();
  const [dark, setDark] = useState(false);
  const toggleSidebar = () => {
    document.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  useEffect(() => {
    if (localStorage.theme === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  const toggleDark = () => {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
    setDark(isDark);
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      "Voulez-vous vraiment vous déconnecter ?"
    );
    if (!confirmLogout) return;

    window.location.href = "/logout";
  };

  return (
    <nav className="glass-panel border-b border-white/10 backdrop-blur-xl text-white px-6 py-4 flex items-center justify-between shadow-md text-shadow">
      {/* Logo / Titre */}
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="md:hidden text-mamastock-gold text-2xl" aria-label="Ouvrir le menu">
          ☰
        </button>
        <h1 className="text-2xl font-bold text-mamastock-gold tracking-widest">
          MAMA STOCK
        </h1>
      </div>

      {/* Zone utilisateur */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              search(e.target.value);
            }}
            placeholder={t('search')}
            className="input w-48"
            aria-label={t('search')}
          />
          {results.length > 0 && (
            <div className="absolute z-10 bg-glass backdrop-blur border border-borderGlass text-white w-full shadow-lg mt-1 text-xs rounded">
              {results.map(r => (
                <div key={r.type + r.id} className="px-2 py-1 border-b last:border-0">
                  {r.type}: {r.nom}
                </div>
              ))}
            </div>
          )}
        </div>
        <LanguageSelector />
        <button
          onClick={toggleDark}
          className="btn px-3 py-1 text-sm"
          title={t('toggleTheme')}
          aria-label={t('toggleTheme')}
          aria-pressed={dark}
        >
          {dark ? '☀️' : '🌙'}
        </button>
        {session?.user?.email && typeof session.user.email === "string" ? (
          <>
            <span className="text-sm text-mamastock-text font-medium">
              {session.user.email}
            </span>
            <span className="text-xs bg-mamastock-gold text-black px-3 py-1 rounded-full capitalize shadow">
              {role || '[Rôle inconnu]'}
            </span>
            {mama_id && (
              <span className="text-xs bg-sky-600 text-white px-3 py-1 rounded-full shadow">
                {mama_id}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md transition"
            >
              {t('logout')}
            </button>
          </>
        ) : (
          <span className="text-sm text-mamastock-text italic">Connexion...</span>
        )}
      </div>
    </nav>
  );
}
