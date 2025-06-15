import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

export default function Navbar() {
  const { session, role } = useAuth();
  const [term, setTerm] = useState("");
  const { results, search } = useGlobalSearch();
  const [dark, setDark] = useState(false);

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
    const confirmLogout = window.confirm("Voulez-vous vraiment vous déconnecter ?");
    if (!confirmLogout) return;

    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <nav className="bg-mamastock-bg border-b border-mamastock-gold text-white px-6 py-4 flex items-center justify-between shadow-md">
      {/* Logo / Titre */}
      <h1 className="text-2xl font-bold text-mamastock-gold tracking-widest">
        MAMA STOCK
      </h1>

      {/* Zone utilisateur */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            value={term}
            onChange={e => { setTerm(e.target.value); search(e.target.value); }}
            placeholder="Recherche..."
            className="input input-bordered text-black w-48"
          />
          {results.length > 0 && (
            <div
              className="absolute z-10 bg-white text-black w-full shadow-lg mt-1 text-xs rounded"
              role="listbox"
              aria-label="Résultats recherche"
            >
              {results.map(r => (
                <div
                  key={r.type + r.id}
                  className="px-2 py-1 border-b last:border-0"
                  role="option"
                  tabIndex="0"
                >
                  {r.type}: {r.nom}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={toggleDark}
          className="bg-mamastock-gold text-black px-3 py-1 rounded-md text-sm"
          title="Basculer mode sombre"
        >
          {dark ? '☀️' : '🌙'}
        </button>
        {session?.user?.email && typeof session.user.email === "string" ? (
          <>
            <span className="text-sm text-mamastock-text font-medium">
              {session.user.email}
            </span>
            <span className="text-xs bg-mamastock-gold text-black px-3 py-1 rounded-full capitalize shadow">
              {role || "chargement..."}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-md transition"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <span className="text-sm text-mamastock-text italic">Connexion...</span>
        )}
      </div>
    </nav>
  );
}
