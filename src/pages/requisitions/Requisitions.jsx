import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@radix-ui/react-dialog";

export default function Requisitions() {
  const { mama_id, user_id, loading: authLoading } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [produits, setProduits] = useState([]);
  const [search, setSearch] = useState("");
  const [periode, setPeriode] = useState({ debut: "", fin: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [createReq, setCreateReq] = useState({ produit_id: "", quantite: 0, zone: "", motif: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!mama_id || authLoading) return;
    supabase.from("products").select("*").eq("mama_id", mama_id)
      .then(({ data }) => setProduits(data || []));
  }, [mama_id, authLoading]);

  useEffect(() => {
    if (!mama_id || authLoading || !periode.debut || !periode.fin) return;
    supabase
      .from("requisitions")
      .select("*")
      .eq("mama_id", mama_id)
      .gte("date_requisition", periode.debut)
      .lte("date_requisition", periode.fin)
      .order("date_requisition", { ascending: false })
      .then(({ data }) => setRequisitions(data || []));
  }, [mama_id, authLoading, periode]);

  const filtered = requisitions.filter(
    r =>
      produits.find(p => p.id === r.produit_id)?.nom?.toLowerCase().includes(search.toLowerCase()) ||
      r.zone?.toLowerCase().includes(search.toLowerCase()) ||
      r.motif?.toLowerCase().includes(search.toLowerCase())
  );

  // Saisie
  const handleCreateReq = async e => {
    e.preventDefault();
    if (!createReq.produit_id || !createReq.quantite) {
      toast.error("Sélectionne un produit et une quantité !");
      return;
    }
    if (Number(createReq.quantite) <= 0) {
      toast.error("Quantité invalide");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("requisitions").insert([
      {
        ...createReq,
        mama_id,
        date_requisition: new Date().toISOString().slice(0, 10),
        created_by: user_id,
      },
    ]);
    if (!error) {
      setShowCreate(false);
      setCreateReq({ produit_id: "", quantite: 0, zone: "", motif: "" });
      toast.success("Réquisition créée !");
      setPeriode(p => ({ ...p }));
    } else {
      toast.error(error.message);
    }
    setSaving(false);
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

  const today = new Date().toISOString().slice(0, 10);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!mama_id) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold text-mamastock-gold mb-4">Réquisitions (sortie stock)</h1>
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
            <Button type="submit" disabled={saving}>Créer</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
