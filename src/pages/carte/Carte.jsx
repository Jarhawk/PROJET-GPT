// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { useCarte } from "@/hooks/useCarte";
import { useFamilles } from "@/hooks/useFamilles";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster, toast } from "react-hot-toast";
import TableContainer from "@/components/ui/TableContainer";
import * as XLSX from "xlsx";

const FOOD_COST_SEUIL = 35;

function CarteTable({ type }) {
  const { fetchCarte, updatePrixVente, toggleCarte } = useCarte();
  const { familles: _famillesHook, fetchFamilles } = useFamilles();
  const [fiches, setFiches] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [search, setSearch] = useState("");
  const [familleFilter, setFamilleFilter] = useState("");
  const [onlyAboveThreshold, setOnlyAboveThreshold] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchCarte(type).then(setFiches);
    fetchFamilles().then(fs => setFamilles(fs || []));
  }, [fetchCarte, fetchFamilles, type]);

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
  const filtered = fiches.filter(f => {
    const fc = f.prix_vente && f.cout_portion ? (f.cout_portion / f.prix_vente) * 100 : null;
    if (search && !f.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (familleFilter && f.famille !== familleFilter) return false;
    if (onlyAboveThreshold && (fc === null || fc <= FOOD_COST_SEUIL)) return false;
    return true;
  });

  const handleExport = () => {
    const rows = filtered.map(f => ({
      Nom: f.nom,
      Famille: f.famille || "",
      "Coût/portion (€)": f.cout_portion ? Number(f.cout_portion).toFixed(2) : "",
      "Prix vente (€)": f.prix_vente ? Number(f.prix_vente).toFixed(2) : "",
      "Marge (€)": f.prix_vente && f.cout_portion ? (f.prix_vente - f.cout_portion).toFixed(2) : "",
      "Food cost (%)": f.prix_vente && f.cout_portion ? ((f.cout_portion / f.prix_vente) * 100).toFixed(1) : "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Carte");
    XLSX.writeFile(wb, "carte_plats.xlsx");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 items-end">
        <input className="input input-bordered" placeholder="Recherche" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select select-bordered" value={familleFilter} onChange={e => setFamilleFilter(e.target.value)}>
          <option value="">Toutes familles</option>
          {familles.map(f => <option key={f.id} value={f.nom}>{f.nom}</option>)}
        </select>
        <label className="flex items-center gap-1">
          <input type="checkbox" className="checkbox" checked={onlyAboveThreshold} onChange={e => setOnlyAboveThreshold(e.target.checked)} />
          <span>Ratio &gt; {FOOD_COST_SEUIL}%</span>
        </label>
        <button className="btn btn-sm" onClick={handleExport}>Export</button>
      </div>
      <TableContainer>
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Famille</th>
              <th className="px-2 py-1">Coût/portion (€)</th>
              <th className="px-2 py-1">Prix vente (€)</th>
              <th className="px-2 py-1">Marge (€)</th>
              <th className="px-2 py-1">Food cost (%)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => {
              const fc = f.prix_vente && f.cout_portion ? (f.cout_portion / f.prix_vente) * 100 : null;
              return (
                <tr key={f.id}>
                  <td className="px-2 py-1"><Link to={`/fiches/${f.id}`}>{f.nom}</Link></td>
                  <td className="px-2 py-1">{f.famille || "-"}</td>
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
                  <td className="px-2 py-1">{f.prix_vente && f.cout_portion ? (f.prix_vente - f.cout_portion).toFixed(2) : "-"}</td>
                  <td className={`px-2 py-1 font-semibold ${fc > FOOD_COST_SEUIL ? "text-red-600" : ""}`}>{fc ? fc.toFixed(1) : "-"}</td>
                  <td className="px-2 py-1">
                    <button className="btn btn-xs" onClick={() => handleRemove(f)}>Retirer</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableContainer>
    </div>
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
