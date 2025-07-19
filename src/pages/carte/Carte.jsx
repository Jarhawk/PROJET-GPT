// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCarte } from "@/hooks/useCarte";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster, toast } from "react-hot-toast";

const FOOD_COST_SEUIL = 35;

function CarteTable({ type }) {
  const { fetchCarte, updatePrixVente, toggleCarte } = useCarte();
  const [fiches, setFiches] = useState([]);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchCarte(type).then(setFiches);
  }, [fetchCarte, type]);

  const handleChangePV = async (fiche, pv) => {
    setSavingId(fiche.id);
    try {
      await updatePrixVente(fiche.id, pv);
      setFiches(fs => fs.map(f => (f.id === fiche.id ? { ...f, prix_vente: pv } : f)));
      toast.success("Prix enregistré");
    } catch (e) {
      toast.error(e.message);
    }
    setSavingId(null);
  };

  const handleRemove = async fiche => {
    await toggleCarte(fiche.id, false);
    setFiches(fs => fs.filter(f => f.id !== fiche.id));
  };

  return (
    <table className="min-w-full table-auto">
      <thead>
        <tr>
          <th className="px-2 py-1">Nom</th>
          <th className="px-2 py-1">Sous-type</th>
          <th className="px-2 py-1">Coût/portion (€)</th>
          <th className="px-2 py-1">Prix vente (€)</th>
          <th className="px-2 py-1">Food cost (%)</th>
          <th className="px-2 py-1"></th>
        </tr>
      </thead>
      <tbody>
        {fiches.map(f => {
          const fc = f.prix_vente && f.cout_portion ? (f.cout_portion / f.prix_vente) * 100 : null;
          return (
            <tr key={f.id}>
              <td className="px-2 py-1">{f.nom}</td>
              <td className="px-2 py-1">{f.sous_type_carte || f.famille || "-"}</td>
              <td className="px-2 py-1">{f.cout_portion ? Number(f.cout_portion).toFixed(2) : "-"}</td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  className="input input-bordered w-24"
                  value={f.prix_vente ?? ""}
                  disabled={savingId === f.id}
                  onChange={e => handleChangePV(f, e.target.value ? Number(e.target.value) : null)}
                />
              </td>
              <td className={`px-2 py-1 font-semibold ${fc > FOOD_COST_SEUIL ? "text-red-600" : ""}`}>{fc ? fc.toFixed(1) : "-"}</td>
              <td className="px-2 py-1">
                <button className="btn btn-xs" onClick={() => handleRemove(f)}>Retirer</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function Carte() {
  const { isAuthenticated, access_rights } = useAuth();
  const [tab, setTab] = useState("nourriture");

  if (!isAuthenticated) return null;
  if (!access_rights?.menus?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster />
      <Tabs>
        <TabsList>
          <TabsTrigger onClick={() => setTab("nourriture")} isActive={tab === "nourriture"}>Carte Nourriture</TabsTrigger>
          <TabsTrigger onClick={() => setTab("boisson")} isActive={tab === "boisson"}>Carte Boisson</TabsTrigger>
        </TabsList>
        <TabsContent isActive={tab === "nourriture"}>
          <CarteTable type="nourriture" />
        </TabsContent>
        <TabsContent isActive={tab === "boisson"}>
          <CarteTable type="boisson" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
