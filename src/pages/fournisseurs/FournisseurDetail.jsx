import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import toast, { Toaster } from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import * as XLSX from "xlsx";
import FournisseurForm from "@/components/fournisseurs/FournisseurForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

export default function FournisseurDetail() {
  const { id } = useParams();
  const { isAuthenticated, loading: authLoading, claims } = useAuth();
  const navigate = useNavigate();

  const [fournisseur, setFournisseur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalFactures: 0, totalMontant: 0, lastFactures: [] });
  const [error, setError] = useState("");
  // Historique prix/achats
  const [historique, setHistorique] = useState([]);
  const [produits, setProduits] = useState([]);
  const [selectedProduit, setSelectedProduit] = useState("");
  const [graphAchats, setGraphAchats] = useState([]);
  const [topProduits, setTopProduits] = useState([]);
  // Contacts multiples
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ nom: "", email: "", telephone: "" });
  // Export loading
  const [exporting, setExporting] = useState(false);

  // Modale édition
  const [editModal, setEditModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  // Récupération des données
  useEffect(() => {
    if (!id || !claims?.mama_id || !isAuthenticated) return;
    setLoading(true);

    Promise.all([
      supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .eq("mama_id", claims.mama_id)
        .single(),
      supabase
        .from("invoices")
        .select("id, numero, montant, date_facture")
        .eq("supplier_id", id)
        .eq("mama_id", claims.mama_id)
        .order("date_facture", { ascending: false }),
      // Historique prix/produits
      supabase
        .from("invoice_lines")
        .select("*, products(nom)")
        .eq("mama_id", claims.mama_id)
        .order("created_at", { ascending: true }),
      // Tous produits de ce fournisseur (pour dropdown historique)
      supabase
        .from("products")
        .select("id, nom")
        .eq("mama_id", claims.mama_id),
      // Contacts multiples
      supabase
        .from("fournisseur_contacts")
        .select("*")
        .eq("fournisseur_id", id)
        .eq("mama_id", claims.mama_id),
    ]).then(([fourRes, facturesRes, histoRes, prodRes, contactsRes]) => {
      // Fiche fournisseur
      if (fourRes.error || !fourRes.data) {
        setError("Fournisseur introuvable ou accès refusé.");
        setFournisseur(null);
      } else {
        setFournisseur(fourRes.data);
      }
      // Stats factures
      const factures = facturesRes.data || [];
      setStats({
        totalFactures: factures.length,
        totalMontant: factures.reduce((acc, f) => acc + (parseFloat(f.montant) || 0), 0),
        lastFactures: factures.slice(0, 5),
        allFactures: factures,
      });
      // Historique
      setHistorique((histoRes.data || []).filter(l => factures.some(f => f.id === l.invoice_id)));
      setProduits(prodRes.data || []);
      // Contacts
      setContacts(contactsRes.data || []);
      setLoading(false);
    });
    // eslint-disable-next-line
  }, [id, claims?.mama_id, isAuthenticated]);

  // Graphique achats (mensuel + top produits)
  useEffect(() => {
    if (!stats.allFactures || historique.length === 0) return;
    // Achats par mois
    const mois = {};
    stats.allFactures.forEach(f => {
      const d = f.date_facture?.slice(0, 7) || "N/A";
      mois[d] = (mois[d] || 0) + (parseFloat(f.montant) || 0);
    });
    setGraphAchats(Object.entries(mois).map(([mois, montant]) => ({ mois, montant })));

    // Top produits (total TTC par produit)
    const prodAgg = {};
    historique.forEach(l => {
      if (!l.product_id) return;
      prodAgg[l.product_id] = (prodAgg[l.product_id] || 0) + (l.quantite * l.prix_unitaire);
    });
    setTopProduits(
      Object.entries(prodAgg)
        .map(([pid, total]) => ({
          pid,
          nom: produits.find(p => p.id === pid)?.nom || pid,
          total,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
    );
  }, [stats.allFactures, historique, produits]);

  const handleActivate = async () => {
    if (!fournisseur) return;
    const { error } = await supabase
      .from("suppliers")
      .update({ actif: !fournisseur.actif })
      .eq("id", id)
      .eq("mama_id", claims.mama_id);
    if (error) {
      toast.error("Erreur lors de la modification.");
    } else {
      toast.success(fournisseur.actif ? "Fournisseur désactivé." : "Fournisseur activé.");
      setFournisseur(f => f ? { ...f, actif: !f.actif } : f);
    }
  };

  // Ajout/suppression contact
  const handleAddContact = async () => {
    if (!newContact.nom || !newContact.email) return;
    const { error, data } = await supabase
      .from("fournisseur_contacts")
      .insert([{ ...newContact, fournisseur_id: id, mama_id: claims.mama_id }])
      .select()
      .single();
    if (error) {
      toast.error("Erreur ajout contact.");
    } else {
      toast.success("Contact ajouté !");
      setContacts((prev) => [...prev, data]);
      setNewContact({ nom: "", email: "", telephone: "" });
    }
  };

  const handleDeleteContact = async (cId) => {
    const { error } = await supabase
      .from("fournisseur_contacts")
      .delete()
      .eq("id", cId)
      .eq("mama_id", claims.mama_id);
    if (error) {
      toast.error("Erreur suppression contact.");
    } else {
      toast.success("Contact supprimé.");
      setContacts(contacts.filter(c => c.id !== cId));
    }
  };

  // Export Excel
  const handleExport = () => {
    setExporting(true);
    const ws = XLSX.utils.json_to_sheet(
      stats.allFactures.map(f => ({
        Numéro: f.numero,
        Date: f.date_facture,
        Montant: parseFloat(f.montant).toFixed(2)
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Factures");
    XLSX.writeFile(wb, `Fournisseur_${fournisseur.nom}_factures.xlsx`);
    setExporting(false);
    toast.success("Export Excel généré !");
  };

  // Historique prix courbe
  const prixHistoriqueProduit = (pid) =>
    historique
      .filter(l => l.product_id === pid)
      .map(l => ({
        date: l.created_at?.slice(0, 10) || "N/A",
        prix: l.prix_unitaire,
      }));

  // Callback après édition (modale)
  const handleEdited = () => {
    setEditModal(false);
    // L’useEffect recharge auto le détail fournisseur
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Toaster />
        <span className="text-mamastock-gold animate-pulse">
          Chargement…
        </span>
      </div>
    );
  }
  if (!isAuthenticated || !fournisseur) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center text-red-700">
        {error || "Fournisseur introuvable ou accès refusé."}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Toaster />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-mamastock-gold">
          Fiche fournisseur
        </h1>
        <div className="flex gap-2">
          <Button
            className={fournisseur.actif ? "bg-red-500 text-white" : "bg-green-500 text-white"}
            onClick={handleActivate}
            variant="secondary"
          >
            {fournisseur.actif ? "Désactiver" : "Activer"}
          </Button>
          <Button
            className="ml-2"
            variant="secondary"
            onClick={() => setEditModal(true)}
          >
            Modifier
          </Button>
        </div>
      </div>

      {/* Infos fournisseur */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <p><strong>Nom :</strong> {fournisseur.nom}</p>
        <p><strong>Ville :</strong> {fournisseur.ville || "-"}</p>
        <p><strong>Email :</strong> {fournisseur.email || "-"}</p>
        <p><strong>Téléphone :</strong> {fournisseur.telephone || "-"}</p>
        <p>
          <strong>Statut :</strong>{" "}
          {fournisseur.actif
            ? <span className="text-green-600 font-semibold">Actif</span>
            : <span className="text-red-600 font-semibold">Inactif</span>
          }
        </p>
      </div>

      {/* Contacts multiples */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-mamastock-gold mb-2">Contacts du fournisseur</h2>
        <table className="min-w-full table-auto mb-2">
          <thead>
            <tr>
              <th className="px-2 py-1">Nom</th>
              <th className="px-2 py-1">Email</th>
              <th className="px-2 py-1">Téléphone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-center text-gray-500">
                  Aucun contact enregistré.
                </td>
              </tr>
            )}
            {contacts.map(c => (
              <tr key={c.id}>
                <td className="px-2 py-1">{c.nom}</td>
                <td className="px-2 py-1">{c.email}</td>
                <td className="px-2 py-1">{c.telephone}</td>
                <td className="px-2 py-1">
                  <Button
                    variant="destructive"
                    className="btn-xs"
                    onClick={() => handleDeleteContact(c.id)}
                  >
                    Suppr
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              <td>
                <input
                  className="input input-bordered w-full"
                  placeholder="Nom"
                  value={newContact.nom}
                  onChange={e => setNewContact(nc => ({ ...nc, nom: e.target.value }))}
                />
              </td>
              <td>
                <input
                  className="input input-bordered w-full"
                  placeholder="Email"
                  type="email"
                  value={newContact.email}
                  onChange={e => setNewContact(nc => ({ ...nc, email: e.target.value }))}
                />
              </td>
              <td>
                <input
                  className="input input-bordered w-full"
                  placeholder="Téléphone"
                  value={newContact.telephone}
                  onChange={e => setNewContact(nc => ({ ...nc, telephone: e.target.value }))}
                />
              </td>
              <td>
                <Button className="btn-xs" onClick={handleAddContact}>
                  Ajouter
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Stats & export */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-mamastock-gold mb-2">Statistiques achats</h2>
        <p><strong>Nombre de factures :</strong> {stats.totalFactures}</p>
        <p><strong>Total achats :</strong> {stats.totalMontant.toFixed(2)} €</p>
        <div className="flex gap-4 items-center mt-4">
          <Button onClick={handleExport} disabled={exporting}>
            Exporter les factures (Excel)
          </Button>
        </div>
        <h3 className="font-semibold mt-4 mb-2">Dernières factures</h3>
        <table className="min-w-full table-auto mb-4">
          <thead>
            <tr>
              <th className="px-2 py-1">Numéro</th>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Montant</th>
            </tr>
          </thead>
          <tbody>
            {stats.lastFactures.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-3 text-center text-gray-500">
                  Aucune facture enregistrée.
                </td>
              </tr>
            ) : (
              stats.lastFactures.map(f => (
                <tr
                  key={f.id}
                  className="hover:bg-mamastock-bg/10 cursor-pointer"
                  onClick={() => navigate(`/factures/${f.id}`)}
                >
                  <td className="px-2 py-1 underline">{f.numero}</td>
                  <td className="px-2 py-1">
                    {f.date_facture ? new Date(f.date_facture).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-2 py-1">{parseFloat(f.montant).toFixed(2)} €</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Graphique d’achats mensuels */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-mamastock-gold mb-2">
          Graphique achats mensuels
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={graphAchats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="montant" fill="#bfa14d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Top produits */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-mamastock-gold mb-2">
          Top produits achetés
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={topProduits}
              dataKey="total"
              nameKey="nom"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#bfa14d"
              label
            >
              {topProduits.map((entry, idx) => (
                <Cell key={entry.pid} fill={["#bfa14d", "#e2ba63", "#d8d1bc", "#f3e6c1", "#f9f6f0", "#eee6d6", "#e1c699", "#8e7649"][idx % 8]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Historique prix par produit */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-mamastock-gold mb-2">
          Historique prix d’achat (par produit)
        </h2>
        <div className="flex gap-2 mb-4">
          <select
            className="select select-bordered"
            value={selectedProduit}
            onChange={e => setSelectedProduit(e.target.value)}
          >
            <option value="">Choisir un produit</option>
            {produits.map(p => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>
        {selectedProduit && (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={prixHistoriqueProduit(selectedProduit)}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="prix" stroke="#bfa14d" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex justify-end">
        <Button className="btn" onClick={() => navigate("/fournisseurs")}>
          Retour à la liste
        </Button>
      </div>

      {/* MODALE ÉDITION (ultra-pro, shadcn/ui + animation) */}
      <AnimatePresence>
        {editModal && (
          <Dialog open={editModal} onOpenChange={setEditModal}>
            <DialogOverlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40"
              />
            </DialogOverlay>
            <DialogContent asChild>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.22, type: "spring" }}
                className="max-w-lg w-full bg-white rounded-xl shadow-2xl relative z-50"
              >
                <DialogHeader>
                  <DialogTitle>Modifier le fournisseur</DialogTitle>
                  <DialogClose asChild>
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-mamastock-gold"
                      onClick={() => setEditModal(false)}
                      aria-label="Fermer"
                    >
                      ✕
                    </button>
                  </DialogClose>
                </DialogHeader>
                <FournisseurForm
                  initialData={fournisseur}
                  onSave={handleEdited}
                  onCancel={() => setEditModal(false)}
                />
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
