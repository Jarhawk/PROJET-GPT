import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@radix-ui/react-dialog";

export default function Inventaire() {
  const { isAuthenticated, claims } = useAuth();
  const [inventaires, setInventaires] = useState([]);
  const [produits, setProduits] = useState([]);
  const [achats, setAchats] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState(null); // {produit, values}
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Charger produits
  useEffect(() => {
    if (!claims?.mama_id) return;
    supabase
      .from("products")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .then(({ data }) => setProduits(data || []));
  }, [claims?.mama_id]);

  // Charger inventaires sur période
  useEffect(() => {
    if (!claims?.mama_id || !periode.debut || !periode.fin) return;
    supabase
      .from("inventaires")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .gte("date_inventaire", periode.debut)
      .lte("date_inventaire", periode.fin)
      .then(({ data }) => setInventaires(data || []));
  }, [claims?.mama_id, periode]);

  // Charger achats (factures) sur période
  useEffect(() => {
    if (!claims?.mama_id || !periode.debut || !periode.fin) return;
    supabase
      .from("facture_lignes")
      .select("produit_id, quantite")
      .eq("mama_id", claims.mama_id)
      .gte("date_livraison", periode.debut)
      .lte("date_livraison", periode.fin)
      .then(({ data }) => setAchats(data || []));
  }, [claims?.mama_id, periode]);

  // Charger ventes boissons sur période
  useEffect(() => {
    if (!claims?.mama_id || !periode.debut || !periode.fin) return;
    supabase
      .from("ventes_boissons")
      .select("boisson_id as produit_id, quantite")
      .eq("mama_id", claims.mama_id)
      .gte("date_vente", periode.debut)
      .lte("date_vente", periode.fin)
      .then(({ data }) => setVentes(data || []));
  }, [claims?.mama_id, periode]);

  // Charger requisitions sur période
  useEffect(() => {
    if (!claims?.mama_id || !periode.debut || !periode.fin) return;
    supabase
      .from("requisitions")
      .select("produit_id, quantite")
      .eq("mama_id", claims.mama_id)
      .gte("date_requisition", periode.debut)
      .lte("date_requisition", periode.fin)
      .then(({ data }) => setRequisitions(data || []));
  }, [claims?.mama_id, periode]);

  // Agréger par produit
  const mouvements = {};
  // Stock initial = inventaire début période
  inventaires
    .filter(i => i.date_inventaire === periode.debut)
    .forEach(i => {
      mouvements[i.produit_id] = mouvements[i.produit_id] || {};
      mouvements[i.produit_id].stock_initial = i.quantite;
    });
  // Stock final = inventaire fin période
  inventaires
    .filter(i => i.date_inventaire === periode.fin)
    .forEach(i => {
      mouvements[i.produit_id] = mouvements[i.produit_id] || {};
      mouvements[i.produit_id].stock_physique = i.quantite;
      mouvements[i.produit_id].id_inventaire = i.id;
      mouvements[i.produit_id].commentaire = i.commentaire || "";
    });
  // Achats
  achats.forEach(a => {
    mouvements[a.produit_id] = mouvements[a.produit_id] || {};
    mouvements[a.produit_id].achats = (mouvements[a.produit_id].achats || 0) + a.quantite;
  });
  // Ventes
  ventes.forEach(v => {
    mouvements[v.produit_id] = mouvements[v.produit_id] || {};
    mouvements[v.produit_id].ventes = (mouvements[v.produit_id].ventes || 0) + v.quantite;
  });
  // Requisitions
  requisitions.forEach(r => {
    mouvements[r.produit_id] = mouvements[r.produit_id] || {};
    mouvements[r.produit_id].requisitions = (mouvements[r.produit_id].requisitions || 0) + r.quantite;
  });

  // Calcul stock théorique, écarts, filtrage
  const produitsAffiches = produits
    .map(p => {
      const m = mouvements[p.id] || {};
      const stockInitial = m.stock_initial || 0;
      const achats = m.achats || 0;
      const ventes = m.ventes || 0;
      const reqs = m.requisitions || 0;
      const stockPhysique = m.stock_physique ?? null;
      const theorique = stockInitial + achats - ventes - reqs;
      const ecart = stockPhysique !== null ? stockPhysique - theorique : null;
      const commentaire = m.commentaire || "";
      const id_inventaire = m.id_inventaire || null;
      return {
        ...p,
        stockInitial,
        achats,
        ventes,
        requisitions: reqs,
        stockPhysique,
        theorique,
        ecart,
        commentaire,
        id_inventaire,
      };
    })
    .filter(p =>
      p.nom?.toLowerCase().includes(search.toLowerCase())
    );

  // Stats globales
  const totalEcart = produitsAffiches.reduce(
    (sum, p) => sum + (p.ecart !== null ? p.ecart : 0),
    0
  );
  const nbConformes = produitsAffiches.filter(
    p => p.ecart !== null && Math.abs(p.ecart) <= 2
  ).length;
  const tauxConformite =
    produitsAffiches.length > 0
      ? (nbConformes / produitsAffiches.length) * 100
      : 100;
  const topEcart = produitsAffiches
    .filter(p => p.ecart !== null)
    .sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart))
    .slice(0, 3);

  // Export Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      produitsAffiches.map(p => ({
        Produit: p.nom,
        'Stock initial': p.stockInitial,
        Achats: p.achats,
        Ventes: p.ventes,
        Requisitions: p.requisitions,
        'Stock théorique': p.theorique,
        'Stock physique': p.stockPhysique,
        Ecart: p.ecart,
        Commentaire: p.commentaire || "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventaire");
    XLSX.writeFile(wb, "Inventaire.xlsx");
    toast.success("Export Excel généré !");
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Inventaire — Suivi écarts théoriques", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [
        [
          "Produit",
          "Stock initial",
          "Achats",
          "Ventes",
          "Requisitions",
          "Théorique",
          "Physique",
          "Ecart",
          "Commentaire",
        ],
      ],
      body: produitsAffiches.map(p => [
        p.nom,
        p.stockInitial,
        p.achats,
        p.ventes,
        p.requisitions,
        p.theorique,
        p.stockPhysique !== null ? p.stockPhysique : "-",
        p.ecart !== null ? p.ecart : "-",
        p.commentaire || "",
      ]),
      styles: { fontSize: 9 },
    });
    // Ajout stats globales
    let y = doc.lastAutoTable.finalY + 8;
    doc.text(
      `Total écart global : ${totalEcart} | Taux conformité : ${tauxConformite.toFixed(
        1
      )}%`,
      10,
      y
    );
    doc.save("Inventaire.pdf");
    toast.success("Export PDF généré !");
  };

  // Edition (correction/justif) stock physique ou commentaire
  const handleEditRow = produit => {
    setEditRow({
      ...produit,
      stockPhysique: produit.stockPhysique ?? "",
      commentaire: produit.commentaire || "",
    });
  };
  const handleSaveEdit = async () => {
    if (!editRow.id_inventaire) {
      toast.error("Aucun inventaire physique à corriger sur cette période !");
      return;
    }
    const { error } = await supabase
      .from("inventaires")
      .update({
        quantite: Number(editRow.stockPhysique),
        commentaire: editRow.commentaire,
      })
      .eq("id", editRow.id_inventaire)
      .eq("mama_id", claims.mama_id);
    if (!error) {
      setInventaires(prev =>
        prev.map(i =>
          i.id === editRow.id_inventaire
            ? { ...i, quantite: Number(editRow.stockPhysique), commentaire: editRow.commentaire }
            : i
        )
      );
      setEditRow(null);
      toast.success("Correction sauvegardée !");
    } else {
      toast.error(error.message);
    }
  };

  // Historique timeline inventaire par produit
  const handleShowTimeline = async produit_id => {
    setLoadingTimeline(true);
    const { data, error } = await supabase
      .from("inventaires")
      .select("date_inventaire, quantite, commentaire")
      .eq("mama_id", claims.mama_id)
      .eq("produit_id", produit_id)
      .order("date_inventaire", { ascending: false });
    if (!error) {
      setTimeline(data || []);
    } else {
      setTimeline([]);
      toast.error("Erreur chargement historique !");
    }
    setLoadingTimeline(false);
  };

  // Sélecteur de période
  const today = new Date().toISOString().slice(0, 10);

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">
        Suivi des écarts théoriques (Inventaire)
      </h1>
      {/* Barre stats */}
      <div className="flex flex-wrap gap-6 mb-4">
        <div>
          <span className="font-semibold text-mamastock-gold">Ecart global :</span>{" "}
          <span className="font-bold">{totalEcart}</span>
        </div>
        <div>
          <span className="font-semibold">Taux conformité :</span>{" "}
          <span className={tauxConformite < 90 ? "text-red-600 font-bold" : "font-bold"}>
            {tauxConformite.toFixed(1)} %
          </span>
        </div>
        <div>
          <span className="font-semibold">Top écarts :</span>{" "}
          {topEcart.map(p => (
            <span key={p.id} className="mr-2">
              {p.nom} ({p.ecart})
            </span>
          ))}
        </div>
        <div>
          <span className="font-semibold">Lignes :</span> {produitsAffiches.length}
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
        <Button onClick={handleExportExcel}>Exporter Excel</Button>
        <Button onClick={handleExportPDF}>Exporter PDF</Button>
      </div>
      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Produit</th>
              <th className="px-2 py-1">Stock initial</th>
              <th className="px-2 py-1">Achats</th>
              <th className="px-2 py-1">Ventes</th>
              <th className="px-2 py-1">Requisitions</th>
              <th className="px-2 py-1">Théorique</th>
              <th className="px-2 py-1">Physique</th>
              <th className="px-2 py-1">Ecart</th>
              <th className="px-2 py-1">Commentaire</th>
              <th className="px-2 py-1"></th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {produitsAffiches.map(p => (
              <tr key={p.id}>
                <td className="px-2 py-1">{p.nom}</td>
                <td className="px-2 py-1">{p.stockInitial}</td>
                <td className="px-2 py-1">{p.achats}</td>
                <td className="px-2 py-1">{p.ventes}</td>
                <td className="px-2 py-1">{p.requisitions}</td>
                <td className="px-2 py-1">{p.theorique}</td>
                <td className="px-2 py-1">
                  {p.stockPhysique !== null ? p.stockPhysique : "-"}
                </td>
                <td className={`px-2 py-1 font-bold ${p.ecart !== null && Math.abs(p.ecart) > 2 ? "text-red-600" : ""}`}>
                  {p.ecart !== null ? p.ecart : "-"}
                </td>
                <td className="px-2 py-1">{p.commentaire || ""}</td>
                <td>
                  <Button size="sm" variant="secondary" onClick={() => handleEditRow(p)}>
                    Corriger/Justifier
                  </Button>
                </td>
                <td>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" onClick={() => handleShowTimeline(p.id)}>
                        Timeline
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white rounded-xl shadow-lg p-6 max-w-lg">
                      <h3 className="font-bold mb-2">
                        Historique inventaire {p.nom}
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
                            </tr>
                          </thead>
                          <tbody>
                            {timeline.map((l, i) => (
                              <tr key={i}>
                                <td>{l.date_inventaire}</td>
                                <td>{l.quantite}</td>
                                <td>{l.commentaire || "-"}</td>
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
      </div>
      {/* Modal édition ligne */}
      <Dialog open={!!editRow} onOpenChange={v => !v && setEditRow(null)}>
        <DialogContent className="bg-white rounded-xl shadow-lg p-6 max-w-md">
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
                <label>Produit : {editRow.nom}</label>
              </div>
              <div>
                <label>Stock physique</label>
                <input
                  type="number"
                  className="input input-bordered w-24"
                  value={editRow.stockPhysique}
                  onChange={e =>
                    setEditRow(r => ({ ...r, stockPhysique: e.target.value }))
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
    </div>
  );
}
