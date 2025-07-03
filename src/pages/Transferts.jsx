// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@radix-ui/react-dialog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import GlassCard from "@/components/ui/GlassCard";
import TableContainer from "@/components/ui/TableContainer";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function Transferts() {
  const { isAuthenticated, mama_id, user_id, loading: authLoading } = useAuth();
  const [transferts, setTransferts] = useState([]);
  const [produits, setProduits] = useState([]);
  const [zones, setZones] = useState([]);
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createTf, setCreateTf] = useState({
    produit_id: "",
    quantite: 0,
    zone_depart: "",
    zone_arrivee: "",
    motif: "",
  });
  const [savingTf, setSavingTf] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    if (!mama_id) return;
    supabase
      .from("produits")
      .select("*")
      .eq("mama_id", mama_id)
      .then(({ data }) => setProduits(data || []));
    supabase
      .from("inventaires")
      .select("zone")
      .eq("mama_id", mama_id)
      .then(({ data }) => {
        const uniques = [
          ...new Set((data || []).map((z) => z.zone).filter(Boolean)),
        ];
        setZones(uniques);
      });
  }, [mama_id]);

  useEffect(() => {
    if (!mama_id || !periode.debut || !periode.fin) return;
    supabase
      .from("transferts")
      .select("*")
      .eq("mama_id", mama_id)
      .gte("date_transfert", periode.debut)
      .lte("date_transfert", periode.fin)
      .order("date_transfert", { ascending: false })
      .then(({ data }) => setTransferts(data || []));
  }, [mama_id, periode]);

  // Jointure produit, calcul coût €
  const filtered = transferts
    .map((t) => {
      const prod = produits.find((p) => p.id === t.produit_id) || {};
      const prix = prod.pmp || prod.dernier_prix || 0;
      const cout = Math.round(t.quantite * prix * 100) / 100;
      return { ...t, nom: prod.nom || "-", prix, cout };
    })
    .filter(
      (t) =>
        t.nom?.toLowerCase().includes(search.toLowerCase()) ||
        t.zone_depart?.toLowerCase().includes(search.toLowerCase()) ||
        t.zone_arrivee?.toLowerCase().includes(search.toLowerCase()) ||
        t.motif?.toLowerCase().includes(search.toLowerCase()),
    );

  // Stats globales coût total
  const totalEuro = filtered.reduce((sum, t) => sum + (t.cout || 0), 0);
  // Par couple de zones
  const statsZone = {};
  filtered.forEach((t) => {
    const key = `${t.zone_depart}→${t.zone_arrivee}`;
    statsZone[key] = (statsZone[key] || 0) + (t.cout || 0);
  });

  // Graphe coût par zone
  const transfertsParZone = Object.entries(statsZone).map(([key, euro]) => ({
    zone: key,
    Euro: Math.round(euro * 100) / 100,
  }));

  // Top produits transférés (€)
  const statsProduit = {};
  filtered.forEach((t) => {
    statsProduit[t.nom] = (statsProduit[t.nom] || 0) + (t.cout || 0);
  });
  const topProduits = Object.entries(statsProduit)
    .map(([nom, euro]) => ({
      nom,
      Euro: Math.round(euro * 100) / 100,
    }))
    .sort((a, b) => b.Euro - a.Euro)
    .slice(0, 10);

  // Export Excel/PDF
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((t) => ({
        Produit: t.nom,
        Date: t.date_transfert,
        Quantité: t.quantite,
        "Zone départ": t.zone_depart,
        "Zone arrivée": t.zone_arrivee,
        Motif: t.motif,
        Prix: t.prix,
        "Coût (€)": t.cout,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transferts");
    XLSX.writeFile(wb, "Transferts-stock.xlsx");
    toast.success("Export Excel généré !");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Historique Transferts de stock inter-zones", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [
        [
          "Produit",
          "Date",
          "Quantité",
          "Zone départ",
          "Zone arrivée",
          "Motif",
          "Prix",
          "Coût (€)",
        ],
      ],
      body: filtered.map((t) => [
        t.nom,
        t.date_transfert,
        t.quantite,
        t.zone_depart,
        t.zone_arrivee,
        t.motif,
        t.prix,
        t.cout,
      ]),
      styles: { fontSize: 9 },
    });
    doc.save("Transferts-stock.pdf");
    toast.success("Export PDF généré !");
  };

  // Saisie création transfert
  const handleCreateTf = async (e) => {
    e.preventDefault();
    if (savingTf) return;
    if (
      !createTf.produit_id ||
      !createTf.quantite ||
      !createTf.zone_depart ||
      !createTf.zone_arrivee
    ) {
      toast.error("Tous les champs sont obligatoires !");
      return;
    }
    if (createTf.zone_depart === createTf.zone_arrivee) {
      toast.error("Zone départ et arrivée doivent être différentes !");
      return;
    }
    if (!mama_id) {
      toast.error("Authentification requise");
      return;
    }
    setSavingTf(true);
    const { error } = await supabase.from("transferts").insert([
      {
        ...createTf,
        mama_id,
        date_transfert: new Date().toISOString().slice(0, 10),
        created_by: user_id,
      },
    ]);
    if (!error) {
      setShowCreate(false);
      setCreateTf({
        produit_id: "",
        quantite: 0,
        zone_depart: "",
        zone_arrivee: "",
        motif: "",
      });
      toast.success("Transfert enregistré !");
      setPeriode((p) => ({ ...p }));
    } else {
      toast.error(error.message);
    }
    setSavingTf(false);
  };

  // Timeline produit
  const handleShowTimeline = async (produit_id) => {
    setLoadingTimeline(true);
    if (!mama_id) return;
    const { data, error } = await supabase
      .from("transferts")
      .select("date_transfert, zone_depart, zone_arrivee, quantite, motif")
      .eq("mama_id", mama_id)
      .eq("produit_id", produit_id)
      .order("date_transfert", { ascending: false });
    if (!error) setTimeline(data || []);
    else {
      setTimeline([]);
      toast.error("Erreur chargement timeline !");
    }
    setLoadingTimeline(false);
  };

  const today = new Date().toISOString().slice(0, 10);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">
        Transferts de stock inter-zones
      </h1>
      {/* Graphiques */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <GlassCard className="p-4">
          <h2 className="font-bold mb-2">Top produits transférés (€)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topProduits}>
              <XAxis dataKey="nom" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Euro" fill="#2196f3" name="Coût (€)" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard className="p-4">
          <h2 className="font-bold mb-2">Valeur (€) par couple de zones</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={transfertsParZone}>
              <XAxis dataKey="zone" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Euro" fill="#e53935" name="Total (€)" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
      {/* Total général */}
      <div className="mb-4 font-bold text-lg text-mamastock-gold">
        Total valeur transférée sur la période :{" "}
        {Math.round(totalEuro * 100) / 100} €
      </div>
      {/* Barre filtre, exports */}
      <div className="flex gap-4 mb-4 items-end">
        <div>
          <label className="block font-medium">Début période</label>
          <input
            type="date"
            className="input input-bordered"
            value={periode.debut}
            onChange={(e) =>
              setPeriode((p) => ({ ...p, debut: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block font-medium">Fin période</label>
          <input
            type="date"
            className="input input-bordered"
            value={periode.fin}
            onChange={(e) => setPeriode((p) => ({ ...p, fin: e.target.value }))}
            max={today}
          />
        </div>
        <input
          className="input input-bordered w-64"
          placeholder="Recherche produit, zone, motif"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleExportExcel}>Export Excel</Button>
        <Button onClick={handleExportPDF}>Export PDF</Button>
        <Button onClick={() => setShowCreate(true)}>+ Nouveau transfert</Button>
      </div>
      <TableContainer>
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Produit</th>
              <th className="px-2 py-1">Zone départ</th>
              <th className="px-2 py-1">Zone arrivée</th>
              <th className="px-2 py-1">Quantité</th>
              <th className="px-2 py-1">Motif</th>
              <th className="px-2 py-1">Prix</th>
              <th className="px-2 py-1">Coût (€)</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td className="px-2 py-1">{t.date_transfert}</td>
                <td className="px-2 py-1">{t.nom}</td>
                <td className="px-2 py-1">{t.zone_depart}</td>
                <td className="px-2 py-1">{t.zone_arrivee}</td>
                <td className="px-2 py-1">{t.quantite}</td>
                <td className="px-2 py-1">{t.motif}</td>
                <td className="px-2 py-1">{t.prix}</td>
                <td className="px-2 py-1 font-bold">{t.cout} €</td>
                <td>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleShowTimeline(t.produit_id)}
                      >
                        Timeline
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-glass backdrop-blur-lg rounded-xl shadow-lg p-6 max-w-lg">
                      <h3 className="font-bold mb-2">
                        Timeline transferts : {t.nom}
                      </h3>
                      {loadingTimeline ? (
                        <LoadingSpinner message="Chargement..." />
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Zone départ</th>
                              <th>Zone arrivée</th>
                              <th>Quantité</th>
                              <th>Motif</th>
                            </tr>
                          </thead>
                          <tbody>
                            {timeline.map((l, i) => (
                              <tr key={i}>
                                <td>{l.date_transfert}</td>
                                <td>{l.zone_depart}</td>
                                <td>{l.zone_arrivee}</td>
                                <td>{l.quantite}</td>
                                <td>{l.motif || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
      {/* Modal création transfert */}
      <Dialog
        open={showCreate}
        onOpenChange={(v) => !v && setShowCreate(false)}
      >
        <DialogContent className="bg-glass backdrop-blur-lg rounded-xl shadow-lg p-6 max-w-md">
          <h2 className="font-bold mb-2">Nouveau transfert de stock</h2>
          <form onSubmit={handleCreateTf} className="space-y-3">
            <div>
              <label>Produit</label>
              <select
                className="input input-bordered w-full"
                value={createTf.produit_id}
                onChange={(e) =>
                  setCreateTf((r) => ({ ...r, produit_id: e.target.value }))
                }
              >
                <option value="">Sélectionne…</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Quantité</label>
              <input
                type="number"
                className="input input-bordered w-24"
                value={createTf.quantite}
                onChange={(e) =>
                  setCreateTf((r) => ({ ...r, quantite: e.target.value }))
                }
                min={0}
              />
            </div>
            <div>
              <label>Zone départ</label>
              <select
                className="input input-bordered w-full"
                value={createTf.zone_depart}
                onChange={(e) =>
                  setCreateTf((r) => ({ ...r, zone_depart: e.target.value }))
                }
              >
                <option value="">Sélectionne…</option>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Zone arrivée</label>
              <select
                className="input input-bordered w-full"
                value={createTf.zone_arrivee}
                onChange={(e) =>
                  setCreateTf((r) => ({ ...r, zone_arrivee: e.target.value }))
                }
              >
                <option value="">Sélectionne…</option>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Motif</label>
              <textarea
                className="input input-bordered w-full"
                value={createTf.motif}
                rows={2}
                onChange={(e) =>
                  setCreateTf((r) => ({ ...r, motif: e.target.value }))
                }
              />
            </div>
            <Button type="submit" disabled={savingTf}>
              {savingTf ? "Enregistrement…" : "Créer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
