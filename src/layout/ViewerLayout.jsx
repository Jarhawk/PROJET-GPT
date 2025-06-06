import Navbar from "@/layout/Navbar";

/**
 * Layout pour les utilisateurs en lecture seule (viewer).
 * Pas de sidebar, uniquement la navbar + contenu centré.
 */
export default function ViewerLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-mamastockBg text-mamastockText">
      <Navbar />
      <main className="flex-1 px-4 py-6 flex justify-center items-start overflow-y-auto">
        <div className="w-full max-w-5xl bg-white text-black rounded-2xl shadow-lg p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
