// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/pages/FournisseurDetail.jsx
import { useState, useEffect } from "react";
import { useFournisseurStats } from "@/hooks/useFournisseurStats";
import { useProduitsFournisseur } from "@/hooks/useProduitsFournisseur";
import { useInvoices } from "@/hooks/useInvoices";
import { useFournisseurs } from "@/hooks/useFournisseurs";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui/GlassCard";
import TableContainer from "@/components/ui/TableContainer";

export default function FournisseurDetail({ id }) {
  const { mama_id } = useAuth();
  const { fetchStatsForFournisseur } = useFournisseurStats();
  const { getProduitsDuFournisseur } = useProduitsFournisseur();
  const { fetchFacturesByFournisseur } = useInvoices();
  const { updateFournisseur } = useFournisseurs();
  const [stats, setStats] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [fournisseur, setFournisseur] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chargement des infos fournisseur et de ses factures
  useEffect(() => {
    if (!id || !mama_id) return;
    setLoading(true);
    Promise.all([
      fetchStatsForFournisseur(id).then(setStats),
      fetchFacturesByFournisseur(id).then(async (arr) => {
        const withCount = await Promise.all(
          (arr || []).map(async (f) => {
            const { count } = await supabase
              .from("facture_lignes")
              .select("id", { count: "exact", head: true })
              .eq("facture_id", f.id)
              .eq("mama_id", mama_id);
            return { ...f, nb_produits: count || 0 };
          })
        );
        setInvoices(withCount);
      }),
      supabase
        .from("fournisseurs")
        .select("id, nom, actif, created_at, contact:fournisseur_contacts(nom,email,tel)")
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single()
        .then(({ data }) => {
          if (data)
            setFournisseur({
              ...data,
              contact: Array.isArray(data.contact) ? data.contact[0] : data.contact,
            });
        }),
    ]).finally(() => setLoading(false));
  }, [id, mama_id]);

  // Met à jour le top produits lors du changement d'id
  useEffect(() => {
    async function loadTop() {
      const ps = await getProduitsDuFournisseur(id);
      setTopProducts(
        ps
          .map(p => ({ nom: p.produit_nom, total: p.total_achat }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 8)
      );
    }
    if (id) loadTop();
  }, [id]);

  if (loading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-mamastockGold mb-2">Détail fournisseur</h2>
      {fournisseur && (
        <div className="space-y-2 mb-2">
          <Button
            size="sm"
            onClick={async () => {
              await updateFournisseur(fournisseur.id, { actif: !fournisseur.actif });
              setFournisseur({ ...fournisseur, actif: !fournisseur.actif });
            }}
          >
            {fournisseur.actif ? "Désactiver" : "Réactiver"}
          </Button>
          <div className="text-sm">
            {fournisseur.contact && (
              <div>
                Contact : {fournisseur.contact.nom || ""}
                {fournisseur.contact.tel && ` - ${fournisseur.contact.tel}`}
                {fournisseur.contact.email && (
                  <span className="ml-1">({fournisseur.contact.email})</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Stats d’achats/factures */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard className="p-4">
          <h3 className="font-semibold mb-2">Évolution achats mensuels</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={stats}>
              <XAxis dataKey="mois" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_achats" stroke="#bfa14d" name="Total Achats" />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard className="p-4">
          <h3 className="font-semibold mb-2">Top produits achetés</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={topProducts}>
              <XAxis dataKey="nom" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#0f1c2e" name="Quantité achetée" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
      {/* Historique des achats */}
      <TableContainer className="mt-4 p-2">
        <h3 className="font-semibold mb-2">Historique des achats</h3>
        <table className="w-full table-auto text-xs">
          <thead>
            <tr>
              <th>Date facture</th>
              <th>Total HT</th>
              <th>Nb produits</th>
              <th>Utilisateur</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(f => (
              <tr key={f.id}>
                <td>{f.date_facture}</td>
                <td>{f.montant_total.toFixed(2)} €</td>
                <td>{f.nb_produits}</td>
                <td>-</td>
                <td>
                  <Button size="sm" variant="outline" onClick={() => window.open(`/factures/${f.id}`)}>
                    Voir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableContainer>
    </div>
  );
}
