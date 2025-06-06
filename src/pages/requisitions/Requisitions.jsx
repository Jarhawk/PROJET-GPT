import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@radix-ui/react-dialog";

export default function Requisitions() {
  const { isAuthenticated, claims } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [produits, setProduits] = useState([]);
  const [search, setSearch] = useState("");
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [editRow, setEditRow] = useState(null); // {requi, values}
  const [showCreate, setShowCreate] = useState(false);
  const [createReq, setCreateReq] = useState({ produit_id: "", quantite: 0, zone: "", motif: "" });
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

  // Charger réquisitions sur période
  useEffect(() => {
    if (!claims?.mama_id || !periode.debut || !periode.fin) return;
    supabase
      .from("requisitions")
      .select("*")
      .eq("mama_id", claims.mama_id)
      .gte("date_requisition", periode.debut)
      .lte("date_requisition", periode.fin)
      .order("date_requisition", { ascending: false })
      .then(({ data }) => setRequisitions(data || []));
  }, [claims?.mama_id, periode]);

  // Stats globales
  const filtered = requisitions.filter(
    r =>
      produits.find(p => p.id === r.produit_id)?.nom?.toLowerCase().includes(search.toLowerCase()) ||
      r.zone?.toLowerCase().includes(search.toLowerCase()) ||
      r.motif?.toLowerCase().includes(search.toLowerCase())
  );
  const totalLignes = filtered.length;
  const totalQt = filtered.reduce((sum, r) => sum + (r.quantite || 0), 0);

  // Création réquisition
  const handleCreateReq = async e => {
    e.preventDefault();
    if (!createReq.produit_id || !createReq.quantite) {
      toast.error("Sélectionne un produit et une quantité !");
      return;
    }
    const { error } = await supabase.from("requisitions").insert([
      {
        ...createReq,
        mama_id: claims.mama_id,
        date_requisition: new Date().toISOString().slice(0, 10),
        created_by: claims.user_id,
      },
    ]);
    if (!error) {
      setShowCreate(false);
      setCreateReq({ produit_id: "", quantite: 0, zone: "", motif: "" });
      toast.success("Réquisition créée !");
      // Refresh
      setPeriode(p => ({ ...p }));
    } else {
      toast.error(error.message);
    }
  };

  // Correction/justif
  const handleEditRow = requi => {
    setEditRow({
      ...requi,
      quantite: requi.quantite || 0,
      motif: requi.motif || "",
    });
  };
  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from("requisitions")
      .update({
        quantite: Number(editRow.quantite),
        motif: editRow.motif,
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

  // Timeline produit
  const handleShowTimeline = async produit_id => {
    setLoadingTimeline(true);
    const { data, error } = await supabase
      .from("requisitions")
      .select("date_requisition, quantite, zone, motif")
      .eq("mama_id", claims.mama_id)
      .eq("produit_id", produit_id)
      .order("date_requisition", { ascending: false });
    if (!error) setTimeline(data || []);
    else {
      setTimeline([]);
      toast.error("Erreur chargement timeline !");
    }
    setLoadingTimeline(false);
  };

  // Export Excel
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map(r => ({
        Produit: produits.find(p => p.id === r.produit_id)?.nom || "-",
        Date: r.date_requisition,
        Quantité: r.quantite,
        Zone: r.zone,
        Motif: r.motif,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Requisitions");
    XLSX.writeFile(wb, "Requisitions.xlsx");
    toast.success("Export Excel généré !");
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Historique Réquisitions", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [["Produit", "Date", "Quantité", "Zone", "Motif"]],
      body: filtered.map(r => [
        produits.find(p => p.id === r.produit_id)?.nom || "-",
        r.date_requisition,
        r.quantite,
        r.zone,
        r.motif,
      ]),
      styles: { fontSize: 9 },
    });
    doc.save("Requisitions.pdf");
    toast.success("Export PDF généré !");
  };

  // Période automatique
  const today = new Date().toISOString().slice(0, 10);

  if (!isAuthenticated) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">Réquisitions (sortie stock)</h1>
      {/* Stats + filtre */}
      <div className="flex flex-wrap gap-6 mb-4">
        <div>
          <span className="font-semibold text-mamastock-gold">Total lignes : </span>
          <span className="font-bold">{totalLignes}</span>
        </div>
        <div>
          <span className="font-semibold">Total Qté : </span>
          <span className="font-bold">{totalQt}</span>
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
          placeholder="Recherche produit, zone ou motif"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button onClick={handleExportExcel}>Export Excel</Button>
        <Button onClick={handleExportPDF}>Export PDF</Button>
        <Button onClick={() => setShowCreate(true)}>+ Nouvelle réquisition</Button>
      </div>
      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Produit</th>
              <th className="px-2 py-1">Quantité</th>
              <th className="px-2 py-1">Zone</th>
              <th className="px-2 py-1">Motif</th>
              <th className="px-2 py-1"></th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td className="px-2 py-1">{r.date_requisition}</td>
                <td className="px-2 py-1">
                  {produits.find(p => p.id === r.produit_id)?.nom || "-"}
                </td>
                <td className="px-2 py-1">{r.quantite}</td>
                <td className="px-2 py-1">{r.zone}</td>
                <td className="px-2 py-1">{r.motif}</td>
                <td>
                  <Button size="sm" variant="secondary" onClick={() => handleEditRow(r)}>
                    Corriger/Justifier
                  </Button>
                </td>
                <td>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleShowTimeline(r.produit_id)}
                      >
                        Timeline produit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white rounded-xl shadow-lg p-6 max-w-lg">
                      <h3 className="font-bold mb-2">
                        Timeline réquisitions : {produits.find(p => p.id === r.produit_id)?.nom}
                      </h3>
                      {loadingTimeline ? (
                        <div>Chargement…</div>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Quantité</th>
                              <th>Zone</th>
                              <th>Motif</th>
                            </tr>
                          </thead>
                          <tbody>
                            {timeline.map((l, i) => (
                              <tr key={i}>
                                <td>{l.date_requisition}</td>
                                <td>{l.quantite}</td>
                                <td>{l.zone}</td>
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
      </div>
      {/* Modal création réquisition */}
      <Dialog open={showCreate} onOpenChange={v => !v && setShowCreate(false)}>
        <DialogContent className="bg-white rounded-xl shadow-lg p-6 max-w-md">
          <h2 className="font-bold mb-2">Nouvelle réquisition</h2>
          <form
            onSubmit={handleCreateReq}
            className="space-y-3"
          >
            <div>
              <label>Produit</label>
              <select
                className="input input-bordered w-full"
                value={createReq.produit_id}
                onChange={e =>
                  setCreateReq(r => ({ ...r, produit_id: e.target.value }))
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
              <label>Quantité</label>
              <input
                type="number"
                className="input input-bordered w-24"
                value={createReq.quantite}
                onChange={e =>
                  setCreateReq(r => ({ ...r, quantite: e.target.value }))
                }
                min={0}
              />
            </div>
            <div>
              <label>Zone</label>
              <input
                className="input input-bordered w-full"
                value={createReq.zone}
                onChange={e =>
                  setCreateReq(r => ({ ...r, zone: e.target.value }))
                }
              />
            </div>
            <div>
              <label>Motif</label>
              <textarea
                className="input input-bordered w-full"
                value={createReq.motif}
                rows={2}
                onChange={e =>
                  setCreateReq(r => ({ ...r, motif: e.target.value }))
                }
              />
            </div>
            <Button type="submit">Créer</Button>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal correction/justif */}
      <Dialog open={!!editRow} onOpenChange={v => !v && setEditRow(null)}>
        <DialogContent className="bg-white rounded-xl shadow-lg p-6 max-w-md">
          <h2 className="font-bold mb-2">
            Correction/justification de la réquisition
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
