// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEcartsInventaire } from "@/hooks/useEcartsInventaire";
import { useAuth } from '@/hooks/useAuth';
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import { saveAs } from "file-saver";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Ecarts() {
  const { loading: authLoading } = useAuth();
  const { data: ecartsRaw, loading, error } = useEcartsInventaire();
  const [search, setSearch] = useState("");

  if (authLoading) {
    return <LoadingSpinner message="Chargement utilisateur..." />;
  }

  if (loading) {
    return <LoadingSpinner message="Chargement des écarts d'inventaire..." />;
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 text-center">
        ❌ Erreur : {error.message}
      </div>
    );
  }

  const baseList = Array.isArray(ecartsRaw) ? ecartsRaw : [];
  const ecarts = [];
  for (let i = 0; i < baseList.length; i += 1) {
    const e = baseList[i];
    if (e.produit.toLowerCase().includes(search.toLowerCase())) {
      ecarts.push(e);
    }
  }
  for (let i = 0; i < ecarts.length - 1; i += 1) {
    for (let j = i + 1; j < ecarts.length; j += 1) {
      if (Math.abs(ecarts[j].ecart) > Math.abs(ecarts[i].ecart)) {
        const tmp = ecarts[i];
        ecarts[i] = ecarts[j];
        ecarts[j] = tmp;
      }
    }
  }
  const safeEcarts = Array.isArray(ecarts) ? ecarts : [];

  const handleExportCSV = () => {
    const headers = ["Produit", "Écart", "Motif"];
    const rows = [];
    for (let i = 0; i < safeEcarts.length; i += 1) {
      const e = safeEcarts[i];
      rows.push([e.produit, e.ecart, e.motif || "Non renseigné"]);
    }
    const csvLines = [];
    for (let i = 0; i < rows.length; i += 1) {
      csvLines.push(rows[i].join(";"));
    }
    const csvContent = [headers.join(";"), ...csvLines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "ecarts_inventaire.csv");
  };

  return (
    <div className="p-6 text-white space-y-6">
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

      {safeEcarts.length === 0 ? (
        <div className="text-gray-400 text-center mt-10">
          📭 Aucun écart détecté pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const cards = [];
            for (let i = 0; i < safeEcarts.length; i += 1) {
              const ecart = safeEcarts[i];
              cards.push(
                <GlassCard key={ecart.id} className="p-4">
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
                </GlassCard>
              );
            }
            return cards;
          })()}
        </div>
      )}
    </div>
  );
}
