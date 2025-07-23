// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/pages/Fournisseurs.jsx
import { useState, useEffect } from "react";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { useFournisseurStats } from "@/hooks/useFournisseurStats";
import { useSupplierProducts } from "@/hooks/useSupplierProducts";
import { useProducts } from "@/hooks/useProducts";
import { useFournisseursInactifs } from "@/hooks/useFournisseursInactifs";
import useAuth from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Dialog, DialogContent } from "@radix-ui/react-dialog";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Toaster, toast } from "react-hot-toast";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import FournisseurDetail from "./FournisseurDetail";
import FournisseurForm from "./FournisseurForm";
import { PlusCircle, Search } from "lucide-react";

export default function Fournisseurs() {
  const { fournisseurs, total, getFournisseurs, createFournisseur, updateFournisseur, disableFournisseur, exportFournisseursToExcel } = useFournisseurs();
  const { fetchStatsAll } = useFournisseurStats();
  const { getProductsBySupplier, countProductsBySupplier } = useSupplierProducts();
  const { products } = useProducts();
  const { fournisseurs: inactiveByInvoices, fetchInactifs } = useFournisseursInactifs();
  const { mama_id, loading: authLoading, access_rights, isSuperadmin } = useAuth();
  const canEdit = isSuperadmin || access_rights?.fournisseurs?.peut_modifier;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [actifFilter, setActifFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const listWithContact = fournisseurs.map(f => ({
    ...f,
    contact: Array.isArray(f.contact) ? f.contact[0] : f.contact,
  }));
  const inactifs = listWithContact.filter(f => !f.actif);

  useEffect(() => {
    async function fetchCounts() {
      const counts = {};
      for (const f of fournisseurs) {
        counts[f.id] = await countProductsBySupplier(f.id);
      }
      setProductCounts(counts);
    }
    if (fournisseurs.length) fetchCounts();
  }, [fournisseurs]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste Fournisseurs", 10, 12);
    doc.autoTable({
      startY: 20,
      head: [["Nom", "Téléphone", "Contact", "Email"]],
      body: listWithContact.map(f => [
        f.nom,
        f.contact?.tel || "",
        f.contact?.nom || "",
        f.contact?.email || "",
      ]),
      styles: { fontSize: 9 },
    });
    doc.save("fournisseurs.pdf");
  };

  // Chargement initial
  useEffect(() => {
    fetchStatsAll().then(setStats);
    fetchInactifs();
  }, []);

  // Rafraîchissement selon la recherche ou filtre
  useEffect(() => {
    if (!authLoading && mama_id) {
      getFournisseurs({
        search,
        actif: actifFilter === "all" ? null : actifFilter === "true",
        page,
        limit: PAGE_SIZE,
      });
    }
  }, [authLoading, mama_id, search, actifFilter, page]);

  // Recherche live
  const fournisseursFiltrés = listWithContact.filter(f =>
    f.nom?.toLowerCase().includes(search.toLowerCase())
  );

  // Top produits global recalculé lorsqu'on reçoit les données
  useEffect(() => {
    async function computeTop() {
      if (!fournisseurs.length || !products.length) return;
      const statsProduits = {};
      for (const f of fournisseurs) {
        const ps = await getProductsBySupplier(f.id);
        ps.forEach(p => {
          statsProduits[p.produit_id] = (statsProduits[p.produit_id] || 0) + (p.total_achat || 0);
        });
      }
      setTopProducts(
        Object.entries(statsProduits)
          .map(([id, total]) => ({ nom: products.find(p => p.id === id)?.nom || "-", total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 8)
      );
    }
    computeTop();
  }, [fournisseurs, products]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!access_rights?.fournisseurs?.peut_voir) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto p-8 text-shadow">
      <Toaster />
      <h1 className="text-2xl font-bold mb-6">Gestion des fournisseurs</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="relative flex-1">
          <input
            className="input input-bordered w-full pl-8"
            placeholder="Recherche fournisseur"
            value={search}
            onChange={e => { setPage(1); setSearch(e.target.value); }}
          />
          <Search className="absolute left-2 top-2.5 text-white" size={18} />
        </div>
        <select className="input" value={actifFilter} onChange={e => { setPage(1); setActifFilter(e.target.value); }}>
          <option value="all">Tous</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
        {canEdit && (
          <Button onClick={() => setShowCreate(true)}>
            <PlusCircle className="mr-2" /> Ajouter fournisseur
          </Button>
        )}
        {canEdit && (
          <Button variant="outline" onClick={exportFournisseursToExcel}>Export Excel</Button>
        )}
        {canEdit && (
          <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
        )}
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
      <TableContainer className="mb-6 shadow-xl rounded-2xl">
        <table className="min-w-full text-center">
          <thead>
            <tr>
              <th className="py-2 px-3">Nom</th>
              <th className="py-2 px-3">Téléphone</th>
              <th className="py-2 px-3">Contact</th>
              <th className="py-2 px-3">Email</th>
              <th className="py-2 px-3">Nb Produits</th>
              <th className="py-2 px-3"></th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {fournisseursFiltrés.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-muted-foreground">
                  Aucun fournisseur trouvé
                </td>
              </tr>
            ) : (
              fournisseursFiltrés.map(f => (
                <tr key={f.id} className={f.actif ? '' : 'opacity-50'}>
                  <td className="py-1 px-3 font-semibold text-white">{f.nom}</td>
                  <td>{f.contact?.tel}</td>
                  <td>{f.contact?.nom}</td>
                  <td>{f.contact?.email}</td>
                  <td>{productCounts[f.id] ?? 0}</td>
                  <td className="flex gap-2 justify-center">
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditRow(f)}
                      >
                        Modifier
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setSelected(f.id)}>
                      Voir détails
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (!window.confirm('Désactiver ce fournisseur ?')) return;
                          await disableFournisseur(f.id, {
                            refreshParams: {
                              search,
                              actif: actifFilter === "all" ? null : actifFilter === "true",
                              page,
                              limit: PAGE_SIZE,
                            },
                          });
                        }}
                      >
                        Supprimer
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="mt-4 flex gap-2 justify-center">
          {Array.from({ length: Math.max(1, Math.ceil(total / PAGE_SIZE)) }, (_, i) => (
            <Button
              key={i + 1}
              size="sm"
              variant={page === i + 1 ? "default" : "outline"}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      </TableContainer>

      {/* Modal création/édition */}
      {canEdit && (
        <Dialog open={showCreate || !!editRow} onOpenChange={v => { if (!v) { setShowCreate(false); setEditRow(null); } }}>
          <DialogContent className="bg-glass backdrop-blur-lg rounded-2xl shadow-xl max-w-lg w-full p-8">
            <FournisseurForm
              fournisseur={editRow}
              saving={saving}
              onCancel={() => { setShowCreate(false); setEditRow(null); }}
              onSubmit={async (data) => {
                if (saving) return;
                setSaving(true);
                try {
                  if (editRow) {
                    await updateFournisseur(editRow.id, data, {
                      refreshParams: {
                        search,
                        actif: actifFilter === "all" ? null : actifFilter === "true",
                        page,
                        limit: PAGE_SIZE,
                      },
                    });
                    toast.success("Fournisseur modifié !");
                  } else {
                    await createFournisseur(data, {
                      refreshParams: {
                        search,
                        actif: actifFilter === "all" ? null : actifFilter === "true",
                        page,
                        limit: PAGE_SIZE,
                      },
                    });
                    toast.success("Fournisseur ajouté !");
                  }
                  setShowCreate(false);
                  setEditRow(null);
                  getFournisseurs({
                    search,
                    actif: actifFilter === "all" ? null : actifFilter === "true",
                    page,
                    limit: PAGE_SIZE,
                  });
                } catch (err) {
                  toast.error(err?.message || "Erreur enregistrement");
                }
                setSaving(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal détail */}
      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="bg-glass backdrop-blur-lg rounded-2xl shadow-xl max-w-2xl w-full p-10">
          {selected && <FournisseurDetail id={selected} />}
        </DialogContent>
      </Dialog>

    </div>
  );
}
