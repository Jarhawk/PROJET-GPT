import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { Dialog, DialogTrigger, DialogContent } from "@radix-ui/react-dialog";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function Inventaire() {
  const { mama_id, loading: authLoading } = useAuth();
  const [inventaires, setInventaires] = useState([]);
  const [produits, setProduits] = useState([]);
  const [achats, setAchats] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [transferts, setTransferts] = useState([]);
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Charger produits (avec dernier_prix/PMP)
  useEffect(() => {
    if (!mama_id || authLoading) return;
    supabase
      .from("products")
      .select("*")
      .eq("mama_id", mama_id)
      .then(({ data }) => setProduits(data || []));
  }, [mama_id, authLoading]);

  // Charger inventaires sur période
  useEffect(() => {
    if (!mama_id || authLoading || !periode.debut || !periode.fin) return;
    supabase
      .from("inventaires")
      .select("*")
      .eq("mama_id", mama_id)
      .gte("date_inventaire", periode.debut)
      .lte("date_inventaire", periode.fin)
      .then(({ data }) => setInventaires(data || []));
  }, [mama_id, authLoading, periode]);

  // Charger achats (factures) sur période
  useEffect(() => {
    if (!mama_id || authLoading || !periode.debut || !periode.fin) return;
    supabase
      .from("facture_lignes")
      .select("produit_id, quantite, zone")
      .eq("mama_id", mama_id)
      .gte("date_livraison", periode.debut)
      .lte("date_livraison", periode.fin)
      .then(({ data }) => setAchats(data || []));
  }, [mama_id, authLoading, periode]);

  // Charger réquisitions sur période
  useEffect(() => {
    if (!mama_id || authLoading || !periode.debut || !periode.fin) return;
    supabase
      .from("requisitions")
      .select("produit_id, quantite, zone")
      .eq("mama_id", mama_id)
      .gte("date_requisition", periode.debut)
      .lte("date_requisition", periode.fin)
      .then(({ data }) => setRequisitions(data || []));
  }, [mama_id, authLoading, periode]);

  // Charger transferts inter-zones sur période
  useEffect(() => {
    if (!mama_id || authLoading || !periode.debut || !periode.fin) return;
    supabase
      .from("transferts")
      .select("*")
      .eq("mama_id", mama_id)
      .gte("date_transfert", periode.debut)
      .lte("date_transfert", periode.fin)
      .then(({ data }) => setTransferts(data || []));
  }, [mama_id, authLoading, periode]);

  // -- Agrégation par produit ET par zone --
  const produitsParZone = {};
  produits.forEach(p => {
    produitsParZone[p.id] = produitsParZone[p.id] || {};
  });
  // Stock initial par zone
  inventaires
    .filter(i => i.date_inventaire === periode.debut)
    .forEach(i => {
      produitsParZone[i.produit_id] = produitsParZone[i.produit_id] || {};
      produitsParZone[i.produit_id][i.zone] = produitsParZone[i.produit_id][i.zone] || {};
      produitsParZone[i.produit_id][i.zone].stockInitial = i.quantite;
    });
  // Stock final par zone
  inventaires
    .filter(i => i.date_inventaire === periode.fin)
    .forEach(i => {
      produitsParZone[i.produit_id] = produitsParZone[i.produit_id] || {};
      produitsParZone[i.produit_id][i.zone] = produitsParZone[i.produit_id][i.zone] || {};
      produitsParZone[i.produit_id][i.zone].stockFinal = i.quantite;
      produitsParZone[i.produit_id][i.zone].id_inventaire = i.id;
      produitsParZone[i.produit_id][i.zone].commentaire = i.commentaire || "";
    });
  // Achats par zone
  achats.forEach(a => {
    produitsParZone[a.produit_id] = produitsParZone[a.produit_id] || {};
    produitsParZone[a.produit_id][a.zone] = produitsParZone[a.produit_id][a.zone] || {};
    produitsParZone[a.produit_id][a.zone].achats =
      (produitsParZone[a.produit_id][a.zone].achats || 0) + a.quantite;
  });
  // Réquisitions par zone
  requisitions.forEach(r => {
    produitsParZone[r.produit_id] = produitsParZone[r.produit_id] || {};
    produitsParZone[r.produit_id][r.zone] = produitsParZone[r.produit_id][r.zone] || {};
    produitsParZone[r.produit_id][r.zone].requisitions =
      (produitsParZone[r.produit_id][r.zone].requisitions || 0) + r.quantite;
  });

  // Liste des zones détectées
  const allZones = Array.from(
    new Set(
      Object.values(produitsParZone)
        .flatMap(zonesObj => Object.keys(zonesObj || {}))
    )
  );

  // produitsAffiches : regroupement pour le tableau principal
  const produitsAffiches = produits
    .map(p => ({
      ...p,
      zones: produitsParZone[p.id] || {},
    }))
    .filter(p =>
      p.nom?.toLowerCase().includes(search.toLowerCase())
    );

  // Stats globales, top écarts avec prix
  const statsGlobales = [];
  produitsAffiches.forEach(p => {
    Object.entries(p.zones).forEach(([zone, v]) => {
      const stockInitial = v.stockInitial || 0;
      const achats = v.achats || 0;
      const requisitions = v.requisitions || 0;
      const stockFinal = v.stockFinal ?? 0;
      const consoTheo = requisitions;
      const consoReelle = stockInitial + achats - stockFinal;
      const ecart = consoReelle - consoTheo;
      const prix = p.pmp || p.dernier_prix || 0;
      const ecartEuro = Math.round(ecart * prix * 100) / 100;
      statsGlobales.push({
        nom: p.nom,
        zone,
        stockInitial,
        achats,
        requisitions,
        stockFinal,
        consoTheo,
        consoReelle,
        ecart,
        prix,
        ecartEuro,
      });
    });
  });

  // Export Excel/PDF de l’audit des écarts (intègre valeur €)
  const handleExportAuditExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      statsGlobales.map(r => ({
        Produit: r.nom,
        Zone: r.zone,
        "Stock initial": r.stockInitial,
        Achats: r.achats,
        Réquisitions: r.requisitions,
        "Stock final": r.stockFinal,
        "Conso théorique": r.consoTheo,
        "Conso réelle": r.consoReelle,
        Ecart: r.ecart,
        Prix: r.prix,
        "Ecart (€)": r.ecartEuro,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit écarts");
    XLSX.writeFile(wb, "Audit-ecarts-inventaire.xlsx");
    toast.success("Export Audit Excel généré !");
  };

  const handleExportAuditPDF = () => {
    const doc = new jsPDF();
    doc.text("Audit des écarts Inventaire (par zone, €)", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [
        [
          "Produit",
          "Zone",
          "Stock initial",
          "Achats",
          "Réquisitions",
          "Stock final",
          "Conso théorique",
          "Conso réelle",
          "Ecart",
          "Prix",
          "Ecart (€)",
        ],
      ],
      body: statsGlobales.map(r => [
        r.nom,
        r.zone,
        r.stockInitial,
        r.achats,
        r.requisitions,
        r.stockFinal,
        r.consoTheo,
        r.consoReelle,
        r.ecart,
        r.prix,
        r.ecartEuro,
      ]),
      styles: { fontSize: 9 },
    });
    doc.save("Audit-ecarts-inventaire.pdf");
    toast.success("Export Audit PDF généré !");
  };

  // Graphe top écarts (absolu, €)
  const topEcarts = statsGlobales
    .map(r => ({
      nom: `${r.nom} (${r.zone})`,
      ecartEuro: r.ecartEuro,
    }))
    .sort((a, b) => Math.abs(b.ecartEuro) - Math.abs(a.ecartEuro))
    .slice(0, 10);

  // Correction/justification
  const handleEditRow = (produit, zone) => {
    const v = produit.zones[zone] || {};
    setEditRow({
      produit,
      zone,
      stockFinal: v.stockFinal ?? "",
      commentaire: v.commentaire || "",
      id_inventaire: v.id_inventaire,
    });
  };
  const handleSaveEdit = async () => {
    if (!editRow.id_inventaire) {
      toast.error("Aucun inventaire à corriger !");
      return;
    }
    const { error } = await supabase
      .from("inventaires")
      .update({
        quantite: Number(editRow.stockFinal),
        commentaire: editRow.commentaire,
      })
      .eq("id", editRow.id_inventaire)
      .eq("mama_id", mama_id);
    if (!error) {
      setInventaires(prev =>
        prev.map(i =>
          i.id === editRow.id_inventaire
            ? { ...i, quantite: Number(editRow.stockFinal), commentaire: editRow.commentaire }
            : i
        )
      );
      setEditRow(null);
      toast.success("Correction sauvegardée !");
    } else {
      toast.error(error.message);
    }
  };

  // Timeline
  const handleShowTimeline = async (produit_id, zone) => {
    setLoadingTimeline(true);
    const { data, error } = await supabase
      .from("inventaires")
      .select("date_inventaire, quantite, commentaire, zone")
      .eq("mama_id", mama_id)
      .eq("produit_id", produit_id)
      .eq("zone", zone)
      .order("date_inventaire", { ascending: false });
    if (!error) setTimeline(data || []);
    else {
      setTimeline([]);
      toast.error("Erreur chargement historique !");
    }
    setLoadingTimeline(false);
  };

  // Sélecteur de période
  const today = new Date().toISOString().slice(0, 10);

  // --- Justificatifs transferts inter-zones (pour période et tous produits) ---
  const filteredTransferts = transferts.map(t => {
    const prod = produits.find(p => p.id === t.produit_id) || {};
    const prix = prod.pmp || prod.dernier_prix || 0;
    const cout = Math.round(t.quantite * prix * 100) / 100;
    return { ...t, nom: prod.nom || "-", prix, cout };
  });

  if (authLoading) return <div className="p-8">Chargement...</div>;
  if (!mama_id) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto text-shadow">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">
        Suivi des écarts théoriques (Inventaire)
      </h1>
      {/* Graphe top écarts */}
      <div className="mb-8 bg-white/5 backdrop-blur-lg shadow rounded-xl p-4 text-white">
        <h2 className="font-bold mb-2">Top écarts valeur (€)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topEcarts}>
            <XAxis dataKey="nom" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Legend />
            <Bar dataKey="ecartEuro" fill="#e53935" name="Ecart (€)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Barre stats */}
      <div className="flex flex-wrap gap-6 mb-4">
        <div>
          <span className="font-semibold text-mamastock-gold">Zones :</span>{" "}
          <span className="font-bold">{allZones.join(", ")}</span>
        </div>
        <div>
          <span className="font-semibold">Lignes :</span>{" "}
          <span className="font-bold">{statsGlobales.length}</span>
        </div>
      </div>
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
          placeholder="Recherche produit"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={handleExportAuditExcel}>Export Audit Excel</Button>
        <Button onClick={handleExportAuditPDF}>Export Audit PDF</Button>
      </div>
      {/* Tableau principal, par zone */}
      <TableContainer>
        <table className="min-w-full table-auto text-center text-white">
          <thead>
            <tr>
              <th className="px-2 py-1">Produit</th>
              <th className="px-2 py-1">Zone</th>
              <th className="px-2 py-1">Stock initial</th>
              <th className="px-2 py-1">Achats</th>
              <th className="px-2 py-1">Réquisitions</th>
              <th className="px-2 py-1">Stock final</th>
              <th className="px-2 py-1">Conso théorique</th>
              <th className="px-2 py-1">Conso réelle</th>
              <th className="px-2 py-1">Ecart</th>
              <th className="px-2 py-1">Prix</th>
              <th className="px-2 py-1">Ecart (€)</th>
              <th className="px-2 py-1"></th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {produitsAffiches.map(p =>
              Object.entries(p.zones).map(([zone, v]) => {
                const stockInitial = v.stockInitial || 0;
                const achats = v.achats || 0;
                const requisitions = v.requisitions || 0;
                const stockFinal = v.stockFinal ?? 0;
                const consoTheo = requisitions;
                const consoReelle = stockInitial + achats - stockFinal;
                const ecart = consoReelle - consoTheo;
                const prix = p.pmp || p.dernier_prix || 0;
                const ecartEuro = Math.round(ecart * prix * 100) / 100;
                return (
                  <tr key={p.id + zone}>
                    <td className="px-2 py-1">{p.nom}</td>
                    <td className="px-2 py-1">{zone}</td>
                    <td className="px-2 py-1">{stockInitial}</td>
                    <td className="px-2 py-1">{achats}</td>
                    <td className="px-2 py-1">{requisitions}</td>
                    <td className="px-2 py-1">{stockFinal}</td>
                    <td className="px-2 py-1 font-semibold">{consoTheo}</td>
                    <td className="px-2 py-1 font-semibold">{consoReelle}</td>
                    <td className={`px-2 py-1 font-bold ${Math.abs(ecart) > 2 ? "text-red-600" : ""}`}>{ecart}</td>
                    <td className="px-2 py-1">{prix}</td>
                    <td className={`px-2 py-1 font-bold ${Math.abs(ecartEuro) > 10 ? "text-red-600" : ""}`}>
                      {ecartEuro} €
                    </td>
                    <td>
                      <Button size="sm" variant="secondary" onClick={() => handleEditRow(p, zone)}>
                        Corriger/Justifier
                      </Button>
                    </td>
                    <td>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => handleShowTimeline(p.id, zone)}>
                            Timeline
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-glass backdrop-blur-lg text-white rounded-xl shadow-lg p-6 max-w-lg">
                          <h3 className="font-bold mb-2">
                            Historique inventaire {p.nom} ({zone})
                          </h3>
                          {loadingTimeline ? (
                            <div>Chargement…</div>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Stock</th>
                                  <th>Commentaire</th>
                                  <th>Zone</th>
                                </tr>
                              </thead>
                              <tbody>
                                {timeline.map((l, i) => (
                                  <tr key={i}>
                                    <td>{l.date_inventaire}</td>
                                    <td>{l.quantite}</td>
                                    <td>{l.commentaire || "-"}</td>
                                    <td>{l.zone || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableContainer>
      {/* Modal édition ligne */}
      <Dialog open={!!editRow} onOpenChange={v => !v && setEditRow(null)}>
        <DialogContent className="bg-glass backdrop-blur-lg text-white rounded-xl shadow-lg p-6 max-w-md">
          <h2 className="font-bold mb-2">
            Correction stock physique / commentaire
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
                <label>Produit : {editRow.produit.nom} / Zone : {editRow.zone}</label>
              </div>
              <div>
                <label>Stock physique</label>
                <input
                  type="number"
                  className="input input-bordered w-24"
                  value={editRow.stockFinal}
                  onChange={e =>
                    setEditRow(r => ({ ...r, stockFinal: e.target.value }))
                  }
                />
              </div>
              <div>
                <label>Commentaire</label>
                <textarea
                  className="input input-bordered w-full"
                  value={editRow.commentaire}
                  rows={2}
                  onChange={e =>
                    setEditRow(r => ({ ...r, commentaire: e.target.value }))
                  }
                />
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Stats globales top écarts */}
      <div className="mt-10 flex flex-wrap gap-8">
        <div>
          <span className="font-semibold">Total produits avec écart &gt; 2 : </span>
          {statsGlobales.filter(r => Math.abs(r.ecart) > 2).length}
        </div>
        <div>
          <span className="font-semibold">Top écarts : </span>
          {statsGlobales
            .sort((a, b) => Math.abs(b.ecartEuro) - Math.abs(a.ecartEuro))
            .slice(0, 3)
            .map(r => (
              <span key={r.nom + r.zone} className="mr-2">
                {r.nom} ({r.zone}) [{r.ecart} = {r.ecartEuro} €]
              </span>
            ))}
        </div>
      </div>
      {/* Section Justif/Audit transferts inter-zones */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-mamastock-gold mb-2">
          Justificatifs transferts inter-zones (période)
        </h2>
        <div className="bg-white shadow rounded-xl p-4 mb-4">
          <table className="min-w-full table-auto text-center text-white">
            <thead>
              <tr>
                <th className="px-2 py-1">Produit</th>
                <th className="px-2 py-1">Zone départ</th>
                <th className="px-2 py-1">Zone arrivée</th>
                <th className="px-2 py-1">Quantité</th>
                <th className="px-2 py-1">Prix</th>
                <th className="px-2 py-1">Coût (€)</th>
                <th className="px-2 py-1">Motif</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransferts.map(t => (
                <tr key={t.id}>
                  <td className="px-2 py-1">{t.nom}</td>
                  <td className="px-2 py-1">{t.zone_depart}</td>
                  <td className="px-2 py-1">{t.zone_arrivee}</td>
                  <td className="px-2 py-1">{t.quantite}</td>
                  <td className="px-2 py-1">{t.prix}</td>
                  <td className="px-2 py-1 font-bold">{t.cout} €</td>
                  <td className="px-2 py-1">{t.motif || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="font-bold mt-3">
            Total valeur transférée sur la période : {Math.round(filteredTransferts.reduce((sum, t) => sum + (t.cout || 0), 0) * 100) / 100} €
          </div>
        </div>
      </div>
    </div>
  );
}
