// src/pages/Mouvements.jsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogOverlay, DialogClose } from "@radix-ui/react-dialog";
import { ResponsiveContainer, BarChart, LineChart, Bar, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { motion as Motion, AnimatePresence } from "framer-motion";

const TYPES = [
  { label: "Entrées", value: "ENTREE" },
  { label: "Sorties", value: "SORTIE" },
];

export default function Mouvements() {
  const { isAuthenticated, claims } = useAuth();
  const [mouvements, setMouvements] = useState([]);
  const [produits, setProduits] = useState([]);
  const [stockInit, setStockInit] = useState({});
  const [tab, setTab] = useState("ENTREE");
  const [search, setSearch] = useState("");
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [editRow, setEditRow] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createMv, setCreateMv] = useState({
    produit_id: "",
    type: tab,
    sous_type: "",
    quantite: 0,
    zone: "",
    motif: "",
  });
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Animation glass
  const glassVariants = {
    hidden: { opacity: 0, y: 24, filter: "blur(20px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: 24, filter: "blur(20px)" }
  };

  // Charger produits
  useEffect(() => {
    if (!claims?.mama_id) return;
    supabase
      .from("products")
      .select("id, nom")
      .eq("mama_id", claims.mama_id)
      .then(({ data }) => setProduits(data || []));
  }, [claims?.mama_id]);

  // Charger mouvements sur période
  useEffect(() => {
    if (!claims?.mama_id || !periode.debut || !periode.fin) return;
    supabase
      .from("mouvements")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .gte("date_mouvement", periode.debut)
      .lte("date_mouvement", periode.fin)
      .order("date_mouvement", { ascending: false })
      .then(({ data }) => setMouvements(data || []));
  }, [claims?.mama_id, periode]);

  // Charger stock initial pour la période
  useEffect(() => {
    if (!claims?.mama_id || !periode.debut) return setStockInit({});
    supabase
      .from("inventaires")
      .select("produit_id, quantite")
      .eq("mama_id", claims.mama_id)
      .eq("date_inventaire", periode.debut)
      .then(({ data }) => {
        const stock = {};
        data?.forEach(l => {
          stock[l.produit_id] = Number(l.quantite) || 0;
        });
        setStockInit(stock);
      });
  }, [claims?.mama_id, periode.debut]);

  // Filtrage dynamique
  const filtered = mouvements.filter(
    m =>
      m.type === tab &&
      (
        produits.find(p => p.id === m.produit_id)?.nom?.toLowerCase().includes(search.toLowerCase()) ||
        m.sous_type?.toLowerCase().includes(search.toLowerCase()) ||
        m.zone?.toLowerCase().includes(search.toLowerCase()) ||
        m.motif?.toLowerCase().includes(search.toLowerCase())
      )
  );

  // Stock théorique live (par produit)
  const mouvementsAgg = {};
  produits.forEach(p => {
    mouvementsAgg[p.id] = { entree: 0, sortie: 0 };
  });
  mouvements.forEach(m => {
    if (m.type === "ENTREE") mouvementsAgg[m.produit_id].entree += Number(m.quantite);
    if (m.type === "SORTIE") mouvementsAgg[m.produit_id].sortie += Number(m.quantite);
  });

  const produitsAffiches = produits
    .map(p => {
      const init = stockInit[p.id] ?? 0;
      const entree = mouvementsAgg[p.id]?.entree || 0;
      const sortie = mouvementsAgg[p.id]?.sortie || 0;
      return {
        ...p,
        stockInit: init,
        entree,
        sortie,
        stockTheo: init + entree - sortie,
      };
    })
    .filter(p => p.nom?.toLowerCase().includes(search.toLowerCase()));

  // Edition/correction mouvement
  const handleEditRow = mv => setEditRow({ ...mv, quantite: mv.quantite || 0, motif: mv.motif || "" });

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from("mouvements")
      .update({
        quantite: Number(editRow.quantite),
        motif: editRow.motif,
        sous_type: editRow.sous_type,
      })
      .eq("id", editRow.id)
      .eq("mama_id", claims.mama_id);
    if (!error) {
      setEditRow(null);
      setPeriode(p => ({ ...p })); // refresh
      toast.success("Correction sauvegardée !");
    } else {
      toast.error(error.message);
    }
  };

  // Création mouvement
  const handleCreateMv = async e => {
    e.preventDefault();
    if (!createMv.produit_id || !createMv.quantite || !createMv.type) {
      toast.error("Produit, type et quantité requis !");
      return;
    }
    const { error } = await supabase.from("mouvements").insert([
      {
        ...createMv,
        mama_id: claims.mama_id,
        date_mouvement: new Date().toISOString().slice(0, 10),
        created_by: claims.user_id,
      },
    ]);
    if (!error) {
      setShowCreate(false);
      setCreateMv({
        produit_id: "",
        type: tab,
        sous_type: "",
        quantite: 0,
        zone: "",
        motif: "",
      });
      toast.success("Mouvement enregistré !");
      setPeriode(p => ({ ...p }));
    } else {
      toast.error(error.message);
    }
  };

  // Timeline produit
  const handleShowTimeline = async produit_id => {
    setLoadingTimeline(true);
    const { data, error } = await supabase
      .from("mouvements")
      .select("date_mouvement, type, sous_type, quantite, zone, motif")
      .eq("mama_id", claims.mama_id)
      .eq("produit_id", produit_id)
      .order("date_mouvement", { ascending: false });
    if (!error) setTimeline(data || []);
    else {
      setTimeline([]);
      toast.error("Erreur chargement timeline !");
    }
    setLoadingTimeline(false);
  };

  // Exports Excel/PDF
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map(m => ({
        Produit: produits.find(p => p.id === m.produit_id)?.nom || "-",
        Date: m.date_mouvement,
        Type: m.type,
        SousType: m.sous_type,
        Quantité: m.quantite,
        Zone: m.zone,
        Motif: m.motif,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mouvements");
    XLSX.writeFile(wb, "Mouvements.xlsx");
    toast.success("Export Excel généré !");
  };
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Historique Mouvements Stock", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [["Produit", "Date", "Type", "Sous-type", "Quantité", "Zone", "Motif"]],
      body: filtered.map(m => [
        produits.find(p => p.id === m.produit_id)?.nom || "-",
        m.date_mouvement,
        m.type,
        m.sous_type,
        m.quantite,
        m.zone,
        m.motif,
      ]),
      styles: { fontSize: 9 },
    });
    doc.save("Mouvements.pdf");
    toast.success("Export PDF généré !");
  };

  // Graphique évolution quotidienne
  const days = [];
  if (periode.debut && periode.fin) {
    const d1 = new Date(periode.debut);
    const d2 = new Date(periode.fin);
    for (let d = new Date(d1); d <= d2; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().slice(0, 10));
    }
  }
  const dataDays = days.map(date => {
    const entrees = mouvements.filter(m => m.date_mouvement === date && m.type === "ENTREE")
      .reduce((sum, m) => sum + Number(m.quantite), 0);
    const sorties = mouvements.filter(m => m.date_mouvement === date && m.type === "SORTIE")
      .reduce((sum, m) => sum + Number(m.quantite), 0);
    return { date, Entrees: entrees, Sorties: sorties };
  });

  // Data graph top produits
  const statsProduit = {};
  filtered.forEach(m => {
    statsProduit[m.produit_id] = (statsProduit[m.produit_id] || 0) + Number(m.quantite || 0);
  });
  const topEntrees = Object.entries(statsProduit)
    .map(([id, qte]) => ({
      nom: produits.find(p => p.id === id)?.nom || "-",
      Quantite: qte,
    }))
    .sort((a, b) => b.Quantite - a.Quantite)
    .slice(0, 10);

  const today = new Date().toISOString().slice(0, 10);

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastockGold drop-shadow mb-4">
        Mouvements de stock (Entrées / Sorties)
      </h1>
      {/* Onglets Entrées/Sorties */}
      <div className="flex gap-2 mb-4">
        {TYPES.map(t => (
          <Button
            key={t.value}
            variant={tab === t.value ? "default" : "secondary"}
            onClick={() => {
              setTab(t.value);
              setCreateMv(m => ({ ...m, type: t.value }));
            }}
          >
            {t.label}
          </Button>
        ))}
      </div>
      {/* Stats graphiques */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="glass-liquid shadow-2xl p-4">
          <h2 className="font-bold mb-2">Evolution quotidienne (Entrées/Sorties)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dataDays}>
              <XAxis dataKey="date" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Entrees" stroke="#2196f3" name="Entrées" />
              <Line type="monotone" dataKey="Sorties" stroke="#e53935" name="Sorties" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-liquid shadow-2xl p-4">
          <h2 className="font-bold mb-2">Top produits {tab.toLowerCase()}s</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topEntrees}>
              <XAxis dataKey="nom" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Quantite" fill={tab === "ENTREE" ? "#2196f3" : "#e53935"} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Stock théorique live */}
      <div className="glass-liquid shadow-2xl p-4 mb-4">
        <h2 className="font-bold mb-2">Stock théorique (période sélectionnée)</h2>
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Produit</th>
              <th className="px-2 py-1">Stock initial</th>
              <th className="px-2 py-1">Entrées</th>
              <th className="px-2 py-1">Sorties</th>
              <th className="px-2 py-1">Stock théorique</th>
            </tr>
          </thead>
          <tbody>
            {produitsAffiches.map(p => (
              <tr key={p.id}>
                <td className="px-2 py-1">{p.nom}</td>
                <td className="px-2 py-1">{p.stockInit}</td>
                <td className="px-2 py-1">{p.entree}</td>
                <td className="px-2 py-1">{p.sortie}</td>
                <td className="px-2 py-1 font-bold">{p.stockTheo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Barre filtre, exports */}
      <div className="flex gap-4 mb-4 items-end">
        <div>
          <label className="block font-medium">Début période</label>
          <input
            type="date"
            className="input input-bordered"
            value={periode.debut}
            onChange={e => setPeriode(p => ({ ...p, debut: e.target.value }))}
          />
        </div>
        <div>
          <label className="block font-medium">Fin période</label>
          <input
            type="date"
            className="input input-bordered"
            value={periode.fin}
            onChange={e => setPeriode(p => ({ ...p, fin: e.target.value }))}
            max={today}
          />
        </div>
        <input
          className="input input-bordered w-64"
          placeholder="Recherche produit, zone, motif"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={handleExportExcel}>Export Excel</Button>
        <Button onClick={handleExportPDF}>Export PDF</Button>
        <Button onClick={() => setShowCreate(true)}>+ Nouveau mouvement</Button>
      </div>
      {/* Table mouvements */}
      <div className="glass-liquid shadow-2xl overflow-x-auto">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Produit</th>
              <th className="px-2 py-1">Type</th>
              <th className="px-2 py-1">Sous-type</th>
              <th className="px-2 py-1">Quantité</th>
              <th className="px-2 py-1">Zone</th>
              <th className="px-2 py-1">Motif</th>
              <th className="px-2 py-1"></th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td className="px-2 py-1">{m.date_mouvement}</td>
                <td className="px-2 py-1">{produits.find(p => p.id === m.produit_id)?.nom || "-"}</td>
                <td className="px-2 py-1">{m.type}</td>
                <td className="px-2 py-1">{m.sous_type}</td>
                <td className="px-2 py-1">{m.quantite}</td>
                <td className="px-2 py-1">{m.zone}</td>
                <td className="px-2 py-1">{m.motif}</td>
                <td>
                  <Button size="sm" variant="secondary" onClick={() => handleEditRow(m)}>
                    Corriger/Justifier
                  </Button>
                </td>
                <td>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleShowTimeline(m.produit_id)}
                      >
                        Timeline produit
                      </Button>
                    </DialogTrigger>
                    <AnimatePresence>
                      {timeline.length > 0 && (
                        <DialogOverlay forceMount>
                          <Motion.div
                            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        </DialogOverlay>
                      )}
                      {timeline.length > 0 && (
                        <DialogContent forceMount className="glass-liquid rounded-2xl p-6 max-w-lg z-50">
                          <Motion.div
                            variants={glassVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <h3 className="font-bold mb-2">
                              Timeline mouvements : {produits.find(p => p.id === timeline[0]?.produit_id)?.nom}
                            </h3>
                            {loadingTimeline ? (
                              <div>Chargement…</div>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Sous-type</th>
                                    <th>Quantité</th>
                                    <th>Zone</th>
                                    <th>Motif</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {timeline.map((l, i) => (
                                    <tr key={i}>
                                      <td>{l.date_mouvement}</td>
                                      <td>{l.type}</td>
                                      <td>{l.sous_type}</td>
                                      <td>{l.quantite}</td>
                                      <td>{l.zone}</td>
                                      <td>{l.motif || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </Motion.div>
                        </DialogContent>
                      )}
                    </AnimatePresence>
                  </Dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal création mouvement */}
      <AnimatePresence>
        {showCreate && (
          <Dialog open={showCreate} onOpenChange={v => !v && setShowCreate(false)}>
            <DialogOverlay forceMount>
              <Motion.div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </DialogOverlay>
            <DialogContent forceMount className="glass-liquid rounded-2xl shadow-2xl p-8 max-w-md z-50">
              <Motion.div
                variants={glassVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <h2 className="font-bold mb-2">Nouveau mouvement stock</h2>
                <form
                  onSubmit={handleCreateMv}
                  className="space-y-3"
                >
                  <div>
                    <label>Produit</label>
                    <select
                      className="input input-bordered w-full"
                      value={createMv.produit_id}
                      onChange={e =>
                        setCreateMv(r => ({ ...r, produit_id: e.target.value }))
                      }
                    >
                      <option value="">Sélectionne…</option>
                      {produits.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Type</label>
                    <select
                      className="input input-bordered w-full"
                      value={createMv.type}
                      onChange={e =>
                        setCreateMv(r => ({ ...r, type: e.target.value }))
                      }
                    >
                      <option value="ENTREE">Entrée</option>
                      <option value="SORTIE">Sortie</option>
                    </select>
                  </div>
                  <div>
                    <label>Sous-type</label>
                    <input
                      className="input input-bordered w-full"
                      value={createMv.sous_type}
                      onChange={e =>
                        setCreateMv(r => ({ ...r, sous_type: e.target.value }))
                      }
                      placeholder="(ex: Achat, Réquisition, Perte, Retour…)"
                    />
                  </div>
                  <div>
                    <label>Quantité</label>
                    <input
                      type="number"
                      className="input input-bordered w-24"
                      value={createMv.quantite}
                      onChange={e =>
                        setCreateMv(r => ({ ...r, quantite: e.target.value }))
                      }
                      min={0}
                    />
                  </div>
                  <div>
                    <label>Zone</label>
                    <input
                      className="input input-bordered w-full"
                      value={createMv.zone}
                      onChange={e =>
                        setCreateMv(r => ({ ...r, zone: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label>Motif</label>
                    <textarea
                      className="input input-bordered w-full"
                      value={createMv.motif}
                      rows={2}
                      onChange={e =>
                        setCreateMv(r => ({ ...r, motif: e.target.value }))
                      }
                    />
                  </div>
                  <Button type="submit">Créer</Button>
                </form>
              </Motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
      {/* Modal correction/justif */}
      <AnimatePresence>
        {editRow && (
          <Dialog open={!!editRow} onOpenChange={v => !v && setEditRow(null)}>
            <DialogOverlay forceMount>
              <Motion.div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </DialogOverlay>
            <DialogContent forceMount className="glass-liquid rounded-2xl shadow-2xl p-8 max-w-md z-50">
              <Motion.div
                variants={glassVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <h2 className="font-bold mb-2">
                  Correction/justification du mouvement
                </h2>
                {editRow && (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleSaveEdit();
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label>Produit : {produits.find(p => p.id === editRow.produit_id)?.nom}</label>
                    </div>
                    <div>
                      <label>Type</label>
                      <select
                        className="input input-bordered w-full"
                        value={editRow.type}
                        onChange={e =>
                          setEditRow(r => ({ ...r, type: e.target.value }))
                        }
                      >
                        <option value="ENTREE">Entrée</option>
                        <option value="SORTIE">Sortie</option>
                      </select>
                    </div>
                    <div>
                      <label>Sous-type</label>
                      <input
                        className="input input-bordered w-full"
                        value={editRow.sous_type}
                        onChange={e =>
                          setEditRow(r => ({ ...r, sous_type: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label>Quantité</label>
                      <input
                        type="number"
                        className="input input-bordered w-24"
                        value={editRow.quantite}
                        onChange={e =>
                          setEditRow(r => ({ ...r, quantite: e.target.value }))
                        }
                        min={0}
                      />
                    </div>
                    <div>
                      <label>Motif</label>
                      <textarea
                        className="input input-bordered w-full"
                        value={editRow.motif}
                        rows={2}
                        onChange={e =>
                          setEditRow(r => ({ ...r, motif: e.target.value }))
                        }
                      />
                    </div>
                    <Button type="submit">Enregistrer</Button>
                  </form>
                )}
              </Motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

// -----------------
// Ajoute ce style global dans ton index.css si pas déjà là :
/*
.glass-liquid {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.25), 0 1.5px 12px 0 #bfa14d44;
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  border-radius: 24px;
  border: 1.5px solid rgba(255,255,255,0.25);
  border-bottom: 2px solid #bfa14d66;
  animation: glassyPop 0.25s cubic-bezier(.6,2,.5,1) both;
}
@keyframes glassyPop {
  0% { opacity: 0; transform: scale(.95) translateY(40px);}
  100% { opacity: 1; transform: scale(1) translateY(0);}
}
*/
// -----------------
