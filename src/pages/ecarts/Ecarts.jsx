import { useEcartsInventaire } from "@/hooks/useEcartsInventaire";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";

export default function Ecarts() {
  const { authReady } = useAuth();
  const { data: ecartsRaw, loading, error } = useEcartsInventaire();
  const [search, setSearch] = useState("");

  if (!authReady) {
    return (
      <div className="p-6 text-white text-center">
        ⏳ Chargement utilisateur...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-white text-center">
        ⏳ Chargement des écarts d'inventaire...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 text-center">
        ❌ Erreur : {error.message}
      </div>
    );
  }

  const ecarts = (ecartsRaw || [])
    .filter((e) =>
      e.produit.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart));

  const handleExportCSV = () => {
    const headers = ["Produit", "Écart", "Motif"];
    const rows = ecarts.map(e => [
      e.produit,
      e.ecart,
      e.motif || "Non renseigné",
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "ecarts_inventaire.csv");
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold text-mamastockGold mb-4">Écarts d'inventaire</h1>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <Input
          placeholder="🔍 Rechercher un produit"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button onClick={handleExportCSV}>📁 Exporter CSV</Button>
      </div>

      {ecarts.length === 0 ? (
        <div className="text-gray-400 text-center mt-10">
          📭 Aucun écart détecté pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ecarts.map((ecart) => (
            <div
              key={ecart.id}
              className="bg-white/10 border border-mamastockGold rounded-xl p-4 hover:bg-white/20 transition"
            >
              <h2 className="text-lg font-semibold">{ecart.produit}</h2>
              <p className="text-sm text-gray-300">
                Écart : <span className="font-bold">{ecart.ecart}</span>
              </p>
              <p className="text-sm text-gray-300">
                Motif : {ecart.motif || "Non renseigné"}
              </p>
              {ecart.date && (
                <p className="text-sm text-gray-400">
                  📅 {new Date(ecart.date).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
