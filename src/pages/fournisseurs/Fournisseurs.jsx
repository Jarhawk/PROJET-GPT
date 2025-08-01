// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/pages/Fournisseurs.jsx
import { useState, useEffect } from "react";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { useFournisseurStats } from "@/hooks/useFournisseurStats";
import { useProduitsFournisseur } from "@/hooks/useProduitsFournisseur";
import { useProducts } from "@/hooks/useProducts";
import { useFournisseursInactifs } from "@/hooks/useFournisseursInactifs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ListingContainer from '@/components/ui/ListingContainer';
import PaginationFooter from '@/components/ui/PaginationFooter';
import TableHeader from '@/components/ui/TableHeader';
import FournisseurRow from "@/components/fournisseurs/FournisseurRow";
import { Dialog, DialogContent } from "@radix-ui/react-dialog";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Toaster, toast } from "react-hot-toast";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import FournisseurDetail from "./FournisseurDetail";
import FournisseurForm from "./FournisseurForm";
import { PlusCircle, Search } from "lucide-react";
import useAuth from "@/hooks/useAuth";

export default function Fournisseurs() {
  const { fournisseurs, total, getFournisseurs, createFournisseur, updateFournisseur, disableFournisseur, exportFournisseursToExcel } = useFournisseurs();
  const { fetchStatsAll } = useFournisseurStats();
  const { getProduitsDuFournisseur, countProduitsDuFournisseur } = useProduitsFournisseur();
  const { products } = useProducts();
  const { fournisseurs: inactiveByInvoices, fetchInactifs } = useFournisseursInactifs();
  const { hasAccess } = useAuth();
  const canEdit = hasAccess("fournisseurs", "peut_modifier");
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

  function refreshList() {
    getFournisseurs({
      search,
      actif: actifFilter === "all" ? null : actifFilter === "true",
      page,
      limit: PAGE_SIZE,
    });
  }
  const listWithContact = fournisseurs.map(f => ({
    ...f,
    contact: Array.isArray(f.contact) ? f.contact[0] : f.contact,
  }));
  const inactifs = listWithContact.filter(f => !f.actif);

  useEffect(() => {
    async function fetchCounts() {
      const counts = {};
      for (const f of fournisseurs) {
        counts[f.id] = await countProduitsDuFournisseur(f.id);
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
    refreshList();
  }, [search, actifFilter, page]);

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
        const ps = await getProduitsDuFournisseur(f.id);
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

  return (
    <div className="max-w-7xl mx-auto p-8 text-shadow space-y-6">
      <Toaster />
      <h1 className="text-2xl font-bold">Gestion des fournisseurs</h1>

      <Card>
        <CardHeader className="pb-4">
          <TableHeader>
            <div className="relative flex-1">
              <input
                className="input w-full pl-8"
                placeholder="Recherche fournisseur"
                value={search}
                onChange={e => { setPage(1); setSearch(e.target.value); }}
              />
              <Search className="absolute left-2 top-2.5 text-white" size={18} />
            </div>
            <select
              className="input w-32"
              value={actifFilter}
              onChange={e => { setPage(1); setActifFilter(e.target.value); }}
            >
              <option value="all">Tous</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </TableHeader>
        </CardHeader>
        <CardContent className="pt-4">
          <TableHeader>
            {canEdit && (
              <Button className="w-auto flex items-center" onClick={() => setShowCreate(true)}>
                <PlusCircle className="mr-2" size={18} /> Ajouter fournisseur
              </Button>
            )}
            <Button className="w-auto" onClick={exportFournisseursToExcel}>
              Export Excel
            </Button>
            <Button className="w-auto" onClick={exportPDF}>
              Export PDF
            </Button>
          </TableHeader>
        </CardContent>
      </Card>
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
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Évolution des achats (tous fournisseurs)</h2>
          </CardHeader>
          <CardContent>
            {stats.length === 0 ? (
              <div className="min-h-[180px] bg-white/5 rounded-xl flex items-center justify-center text-white/50">
                Aucune donnée disponible pour le moment
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={stats}>
                  <XAxis dataKey="mois" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total_achats" stroke="#bfa14d" name="Total Achats" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Top produits achetés</h2>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="min-h-[180px] bg-white/5 rounded-xl flex items-center justify-center text-white/50">
                Aucune donnée disponible pour le moment
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topProducts}>
                  <XAxis dataKey="nom" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#0f1c2e" name="Quantité achetée" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Tableau fournisseurs */}
      <h2 className="font-semibold mb-2">Liste des fournisseurs</h2>
      <ListingContainer className="mb-6">
        <table className="text-sm">
            <thead>
              <tr>
                <th className="py-2 px-3">Nom</th>
                <th className="py-2 px-3">Téléphone</th>
                <th className="py-2 px-3">Contact</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3 text-right">Nb Produits</th>
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
                  <FournisseurRow
                    key={f.id}
                    fournisseur={f}
                    productCount={productCounts[f.id] ?? 0}
                    canEdit={canEdit}
                    onDetail={() => setSelected(f.id)}
                    onEdit={() => setEditRow(f)}
                    onDelete={async (id) => {
                      if (!window.confirm('Désactiver ce fournisseur ?')) return;
                      await disableFournisseur(id);
                      toast.success('Fournisseur désactivé');
                      refreshList();
                    }}
                  />
                ))
              )}
            </tbody>
        </table>
      </ListingContainer>
      <PaginationFooter
        page={page}
        pages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        onPageChange={setPage}
      />

      {/* Modal création/édition */}
      <Dialog open={showCreate || !!editRow} onOpenChange={v => { if (!v) { setShowCreate(false); setEditRow(null); } }}>
        <DialogContent className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl max-w-lg w-full p-8">
          <FournisseurForm
            fournisseur={editRow}
            saving={saving}
            onCancel={() => { setShowCreate(false); setEditRow(null); }}
            onSubmit={async (data) => {
              if (saving) return;
              setSaving(true);
              try {
                if (editRow) {
                  await updateFournisseur(editRow.id, data);
                  toast.success("Fournisseur modifié !");
                } else {
                  await createFournisseur(data);
                  toast.success("Fournisseur ajouté !");
                }
                setShowCreate(false);
                setEditRow(null);
                refreshList();
              } catch (err) {
                toast.error(err?.message || "Erreur enregistrement");
              }
              setSaving(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal détail */}
      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl max-w-2xl w-full p-10">
          {selected && <FournisseurDetail id={selected} />}
        </DialogContent>
      </Dialog>

    </div>
  );
}
