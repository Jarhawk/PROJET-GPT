// src/pages/Fournisseurs.jsx
import { useState, useEffect } from "react";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { useFournisseurStats } from "@/hooks/useFournisseurStats";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { useProducts } from "@/hooks/useProducts";
import { useFournisseursInactifs } from "@/hooks/useFournisseursInactifs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@radix-ui/react-dialog";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Toaster } from "react-hot-toast";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import FournisseurDetail from "./FournisseurDetail";
import { PlusCircle, Search } from "lucide-react";

export default function Fournisseurs() {
  const { fournisseurs, fetchFournisseurs, addFournisseur, updateFournisseur, deleteFournisseur, exportFournisseursToExcel } = useFournisseurs();
  const { fetchStatsAll } = useFournisseurStats();
  const { getProductsBySupplier } = useSupplierProducts();
  const { products } = useProducts();
  const { fournisseurs: inactiveByInvoices, fetchInactifs } = useFournisseursInactifs();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [stats, setStats] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const inactifs = fournisseurs.filter(f => !f.actif);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste Fournisseurs", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [["Nom", "Ville", "Téléphone", "Contact"]],
      body: fournisseurs.map(f => [f.nom, f.ville || "", f.tel || "", f.contact || ""]),
      styles: { fontSize: 9 },
    });
    doc.save("fournisseurs.pdf");
  };

  // Chargement initial des fournisseurs et stats globales
  useEffect(() => {
    fetchFournisseurs();
    fetchStatsAll().then(setStats);
    fetchInactifs();
  }, []);

  // Recherche live
  const fournisseursFiltrés = fournisseurs.filter(f =>
    f.nom?.toLowerCase().includes(search.toLowerCase()) ||
    f.ville?.toLowerCase().includes(search.toLowerCase())
  );

  // Top produits global recalculé lorsqu'on reçoit les données
  useEffect(() => {
    if (!fournisseurs.length || !products.length) return;
    const statsProduits = {};
    fournisseurs.forEach(f => {
      const ps = getProductsBySupplier(f.id) || [];
      ps.forEach(p => {
        statsProduits[p.product_id] = (statsProduits[p.product_id] || 0) + (p.total_achat || 0);
      });
    });
    setTopProducts(Object.entries(statsProduits)
      .map(([id, total]) => ({
        nom: products.find(p => p.id === id)?.nom || "-",
        total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8));
  }, [fournisseurs, products]);

  return (
    <div className="max-w-7xl mx-auto p-8" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
      <Toaster />
      <h1 className="text-2xl font-bold mb-6">Gestion des fournisseurs</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="relative flex-1">
          <input
            className="input input-bordered w-full pl-8"
            placeholder="Recherche fournisseur ou ville"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search className="absolute left-2 top-2.5 text-white" size={18} />
        </div>
        <Button onClick={() => setShowCreate(true)}><PlusCircle className="mr-2" /> Ajouter fournisseur</Button>
        <Button variant="outline" onClick={exportFournisseursToExcel}>Export Excel</Button>
        <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
      </div>
      {inactifs.length > 0 && (
        <div className="mb-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
          {inactifs.length} fournisseur(s) inactif(s)
        </div>
      )}
      {inactiveByInvoices.length > 0 && (
        <div className="mb-4 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1">
          {inactiveByInvoices.length} fournisseur(s) sans facture depuis 6 mois
        </div>
      )}
      {/* Statistiques générales */}
      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <div className="bg-glass backdrop-blur-lg p-4 rounded-xl shadow-md">
          <h2 className="font-semibold mb-2">Évolution des achats (tous fournisseurs)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats}>
              <XAxis dataKey="mois" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_achats" stroke="#bfa14d" name="Total Achats" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-glass backdrop-blur-lg p-4 rounded-xl shadow-md">
          <h2 className="font-semibold mb-2">Top produits achetés</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topProducts}>
              <XAxis dataKey="nom" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#0f1c2e" name="Quantité achetée" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Tableau fournisseurs */}
      <div className="bg-white/5 backdrop-blur-lg overflow-x-auto shadow-xl rounded-2xl mb-6">
        <table className="min-w-full text-center">
          <thead>
            <tr>
              <th className="py-2 px-3">Nom</th>
              <th className="py-2 px-3">Ville</th>
              <th className="py-2 px-3">Téléphone</th>
              <th className="py-2 px-3">Contact</th>
              <th className="py-2 px-3">Nb Produits</th>
              <th className="py-2 px-3"></th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {fournisseursFiltrés.map(f => (
              <tr key={f.id} className={f.actif ? '' : 'opacity-50'}>
                <td className="py-1 px-3 font-semibold text-white">{f.nom}</td>
                <td>{f.ville}</td>
                <td>{f.tel}</td>
                <td>{f.contact}</td>
                <td>{getProductsBySupplier(f.id)?.length || 0}</td>
                <td>
                  <Button size="sm" variant="outline" onClick={() => setSelected(f.id)}>
                    Voir détails
                  </Button>
                </td>
                <td>
                  <Button size="sm" variant="destructive" onClick={() => deleteFournisseur(f.id)}>
                    Supprimer
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal création/édition */}
      <Dialog open={showCreate || !!editRow} onOpenChange={v => { if (!v) { setShowCreate(false); setEditRow(null); } }}>
        <DialogContent className="bg-glass backdrop-blur-lg rounded-2xl shadow-xl max-w-lg w-full p-8">
          <FournisseurForm
            fournisseur={editRow}
            onCancel={() => { setShowCreate(false); setEditRow(null); }}
            onSubmit={async (data) => {
              if (editRow) await updateFournisseur(editRow.id, data);
              else await addFournisseur(data);
              setShowCreate(false);
              setEditRow(null);
              fetchFournisseurs();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal détail */}
      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="bg-glass backdrop-blur-lg rounded-2xl shadow-xl max-w-2xl w-full p-10">
          {selected && <FournisseurDetail id={selected} />}
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ---- FournisseurForm à placer dans src/components/fournisseurs/FournisseurForm.jsx

function FournisseurForm({ fournisseur = {}, onCancel, onSubmit }) {
  const [form, setForm] = useState({
    nom: fournisseur.nom || "",
    ville: fournisseur.ville || "",
    tel: fournisseur.tel || "",
    contact: fournisseur.contact || "",
    actif: fournisseur.actif ?? true,
  });
  return (
    <form
      className="space-y-4"
      onSubmit={e => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <div>
        <label className="block font-semibold">Nom</label>
        <input
          className="input input-bordered w-full"
          value={form.nom}
          onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
          required
        />
      </div>
      <div>
        <label className="block font-semibold">Ville</label>
        <input
          className="input input-bordered w-full"
          value={form.ville}
          onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
        />
      </div>
      <div>
        <label className="block font-semibold">Téléphone</label>
        <input
          className="input input-bordered w-full"
          value={form.tel}
          onChange={e => setForm(f => ({ ...f, tel: e.target.value }))}
        />
      </div>
      <div>
        <label className="block font-semibold">Contact</label>
        <input
          className="input input-bordered w-full"
          value={form.contact}
          onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
        />
      </div>
      <div className="flex gap-4 mt-4">
        <Button type="submit">Enregistrer</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
