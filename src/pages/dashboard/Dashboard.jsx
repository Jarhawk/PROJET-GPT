// src/pages/Dashboard.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// 🟡 Helper pour formatage nombre
const format = (n) => n?.toLocaleString("fr-FR") ?? "-";

// Card composant réutilisable
function StatCard({ title, value, icon }) {
  return (
    <div className="flex flex-col bg-white rounded-2xl shadow p-6 w-full sm:w-60 mb-4 sm:mb-0">
      <div className="flex items-center mb-2">
        {icon && <span className="mr-2 text-2xl text-mamastock-gold">{icon}</span>}
        <span className="font-semibold text-mamastock-gold text-xl">{title}</span>
      </div>
      <span className="text-3xl font-bold text-mamastock-bg">{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading, user, claims } = useAuth();
  const [loading, setLoading] = useState(true);

  // KPIs
  const [stats, setStats] = useState({
    produits: 0,
    fournisseurs: 0,
    factures: 0,
    inventaires: 0,
    fiches: 0,
    stock_theorique: 0,
    mouvements: 0,
    produits_inactifs: 0,
    fournisseurs_inactifs: 0,
    montant_factures: 0,
  });

  const navigate = useNavigate();

  // Redirection si non auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Récupération des KPIs (requêtes Supabase)
  useEffect(() => {
    if (!claims?.mama_id || !isAuthenticated) return;

    async function fetchKPIs() {
      setLoading(true);
      try {
        // 1. Produits actifs/inactifs + stock total
        const { count: produits } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("mama_id", claims.mama_id)
          .eq("actif", true);

        const { count: produits_inactifs } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("mama_id", claims.mama_id)
          .eq("actif", false);

        const { data: stockData } = await supabase
          .from("products")
          .select("quantite_theorique")
          .eq("mama_id", claims.mama_id)
          .eq("actif", true);
        const stock_theorique =
          stockData?.reduce((acc, p) => acc + (p.quantite_theorique || 0), 0) ?? 0;

        // 2. Fournisseurs actifs/inactifs
        const { count: fournisseurs } = await supabase
          .from("suppliers")
          .select("id", { count: "exact", head: true })
          .eq("mama_id", claims.mama_id)
          .eq("actif", true);

        const { count: fournisseurs_inactifs } = await supabase
          .from("suppliers")
          .select("id", { count: "exact", head: true })
          .eq("mama_id", claims.mama_id)
          .eq("actif", false);

        // 3. Factures (total + montant)
        const { count: factures, data: facturesData } = await supabase
          .from("invoices")
          .select("montant", { count: "exact" })
          .eq("mama_id", claims.mama_id);

        const montant_factures =
          facturesData?.reduce((acc, f) => acc + (f.montant || 0), 0) ?? 0;

        // 4. Inventaires
        const { count: inventaires } = await supabase
          .from("inventaires")
          .select("id", { count: "exact", head: true })
          .eq("mama_id", claims.mama_id);

        // 5. Fiches techniques
        const { count: fiches } = await supabase
          .from("fiches_techniques")
          .select("id", { count: "exact", head: true })
          .eq("mama_id", claims.mama_id);

        // 6. Mouvements de stock
        const { count: mouvements } = await supabase
          .from("mouvements")
          .select("id", { count: "exact", head: true })
          .eq("mama_id", claims.mama_id);

        setStats({
          produits: produits ?? 0,
          fournisseurs: fournisseurs ?? 0,
          factures: factures ?? 0,
          inventaires: inventaires ?? 0,
          fiches: fiches ?? 0,
          stock_theorique,
          mouvements: mouvements ?? 0,
          produits_inactifs: produits_inactifs ?? 0,
          fournisseurs_inactifs: fournisseurs_inactifs ?? 0,
          montant_factures: montant_factures ?? 0,
        });
      } catch (err) {
        // Gère les erreurs globales
        // (option : tu peux ajouter un toast d’erreur)
        console.error("Erreur chargement KPIs", err);
      } finally {
        setLoading(false);
      }
    }

    fetchKPIs();
  }, [claims?.mama_id, isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg text-mamastock-gold animate-pulse">
          Chargement du tableau de bord...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirection gérée plus haut
  }

  // Icônes (utilise HeroIcons ou Lucide pour plus de fun si tu veux)
  const icons = {
    produits: "📦",
    fournisseurs: "🏢",
    factures: "📑",
    inventaires: "📋",
    fiches: "📄",
    stock: "📈",
    mouvements: "🔄",
    inactifs: "🚫",
    montant: "💶",
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-mamastock-gold mb-6">
        Bienvenue sur MamaStock
      </h1>
      <div className="bg-white shadow rounded-xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg mb-2">
            Bonjour <span className="font-semibold">{user?.email}</span> !
          </p>
          <p>
            Rôle : <strong>{claims?.role}</strong> – Mama : <strong>{claims?.mama_id}</strong>
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {/* Tu peux mettre un bouton d’accès rapide (ex : nouvelle facture, nouveau produit…) */}
        </div>
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Produits actifs" value={format(stats.produits)} icon={icons.produits} />
        <StatCard title="Produits inactifs" value={format(stats.produits_inactifs)} icon={icons.inactifs} />
        <StatCard title="Fournisseurs actifs" value={format(stats.fournisseurs)} icon={icons.fournisseurs} />
        <StatCard title="Fournisseurs inactifs" value={format(stats.fournisseurs_inactifs)} icon={icons.inactifs} />
        <StatCard title="Stock théorique" value={format(stats.stock_theorique)} icon={icons.stock} />
        <StatCard title="Factures" value={format(stats.factures)} icon={icons.factures} />
        <StatCard title="Total factures" value={format(stats.montant_factures) + " €"} icon={icons.montant} />
        <StatCard title="Inventaires" value={format(stats.inventaires)} icon={icons.inventaires} />
        <StatCard title="Fiches techniques" value={format(stats.fiches)} icon={icons.fiches} />
        <StatCard title="Mouvements stock" value={format(stats.mouvements)} icon={icons.mouvements} />
      </div>
      {/* Ajoute ici tes widgets analytiques (charts, graphes, évolution, TODO list, etc.) */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-mamastock-gold">Analyse & Statistiques (prochaines évolutions)</h2>
        <p className="text-mamastock-text">
          Tu peux intégrer ici des graphiques d’évolution (ex : factures/mois, stock par famille, top produits, alertes de stock bas, etc.).
        </p>
      </div>
    </div>
  );
}
