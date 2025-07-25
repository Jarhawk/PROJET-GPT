// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import useAuth from "@/hooks/useAuth";
import toast from "react-hot-toast";

export function useFournisseurAPI() {
  const { mama_id } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getConfig(fournisseur_id) {
    if (!mama_id || !fournisseur_id) return null;
    const { data, error } = await supabase
      .from("fournisseurs_api_config")
      .select("*")
      .eq("mama_id", mama_id)
      .eq("fournisseur_id", fournisseur_id)
      .single();
    if (error) {
      setError(error);
      toast.error(error.message || "Erreur configuration API");
      return null;
    }
    if (!data?.token && data?.type_api !== "ftp") {
      setError("missing_token");
      toast.error("Token API manquant");
      return null;
    }
    return data;
  }

  async function testConnection(fournisseur_id) {
    const config = await getConfig(fournisseur_id);
    if (!config) return false;
    setLoading(true);
    try {
      const res = await fetch(`${config.url}/ping`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
      return res.ok;
    } catch (err) {
      setError(err);
      toast.error("Erreur test connexion");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function importFacturesFournisseur(fournisseur_id) {
    const config = await getConfig(fournisseur_id);
    if (!config) return [];
    setLoading(true);
    try {
      const res = await fetch(`${config.url}/factures`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
      const factures = await res.json();
      for (const ft of factures) {
        await supabase
          .from("factures")
          .upsert(
            { ...ft, fournisseur_id, mama_id },
            { onConflict: ["fournisseur_id", "numero", "date_facture"] }
          );
      }
      toast.success("Factures importées");
      return factures;
    } catch (err) {
      setError(err);
      toast.error("Erreur import factures");
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function syncCatalogue(fournisseur_id) {
    const config = await getConfig(fournisseur_id);
    if (!config) return [];
    setLoading(true);
    try {
      const res = await fetch(`${config.url}/catalogue`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
      const produits = await res.json();
      const updates = [];
      for (const p of produits) {
        const { data: existing } = await supabase
          .from("fournisseur_produits")
          .select("prix_achat")
          .eq("produit_id", p.produit_id) // ✅ Correction Codex
          .eq("fournisseur_id", fournisseur_id)
          .eq("mama_id", mama_id)
          .order("date_livraison", { ascending: false })
          .limit(1)
          .maybeSingle();
        await supabase
          .from("fournisseur_produits")
          .upsert(
            {
              produit_id: p.produit_id, // ✅ Correction Codex
              fournisseur_id,
              prix_achat: p.price,
              date_livraison: new Date().toISOString().slice(0, 10),
              mama_id,
            },
            { onConflict: ["produit_id", "fournisseur_id", "date_livraison"] }
          );
        if (existing && existing.prix_achat !== p.price) {
          await supabase.from("catalogue_updates").insert({
            fournisseur_id,
            produit_id: p.produit_id, // ✅ Correction Codex
            ancienne_valeur: existing.prix_achat,
            nouvelle_valeur: p.price,
            modification: p,
            mama_id,
          });
          updates.push(p);
        }
      }
      toast.success("Catalogue synchronisé");
      return updates;
    } catch (err) {
      setError(err);
      toast.error("Erreur sync catalogue");
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function envoyerCommande(commande_id) {
    if (!mama_id || !commande_id) return { error: "missing data" };
    setLoading(true);
    setError(null);
    const { data: commande, error } = await supabase
      .from("commandes")
      .select("*")
      .eq("id", commande_id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      setLoading(false);
      setError(error);
      toast.error(error.message || "Erreur récupération commande");
      return { error };
    }
    const config = await getConfig(commande.fournisseur_id);
    if (!config) {
      setLoading(false);
      return { error: "config" };
    }
    try {
      const res = await fetch(`${config.url}/commandes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify(commande),
      });
      const body = await res.json();
      await supabase
        .from("commandes")
        .update({ statut: body.statut || "envoyee" })
        .eq("id", commande_id)
        .eq("mama_id", mama_id);
      toast.success("Commande envoyée");
      return { data: body };
    } catch (err) {
      setError(err);
      toast.error("Erreur envoi commande");
      return { error: err };
    } finally {
      setLoading(false);
    }
  }

  async function getCommandeStatus(commande_id) {
    if (!mama_id || !commande_id) return { error: "missing data" };
    setLoading(true);
    setError(null);
    const { data: cmd, error } = await supabase
      .from("commandes")
      .select("fournisseur_id")
      .eq("id", commande_id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      setLoading(false);
      setError(error);
      toast.error(error.message || "Erreur récupération commande");
      return { error };
    }
    const config = await getConfig(cmd.fournisseur_id);
    if (!config) {
      setLoading(false);
      return { error: "config" };
    }
    try {
      const res = await fetch(
        `${config.url}/commandes/${commande_id}/status`,
        {
          headers: { Authorization: `Bearer ${config.token}` },
        }
      );
      const body = await res.json();
      return { data: body };
    } catch (err) {
      setError(err);
      toast.error("Erreur statut commande");
      return { error: err };
    } finally {
      setLoading(false);
    }
  }

  async function cancelCommande(commande_id) {
    if (!mama_id || !commande_id) return { error: "missing data" };
    setLoading(true);
    setError(null);
    const { data: cmd, error } = await supabase
      .from("commandes")
      .select("fournisseur_id")
      .eq("id", commande_id)
      .eq("mama_id", mama_id)
      .single();
    if (error) {
      setLoading(false);
      setError(error);
      toast.error(error.message || "Erreur récupération commande");
      return { error };
    }
    const config = await getConfig(cmd.fournisseur_id);
    if (!config) {
      setLoading(false);
      return { error: "config" };
    }
    try {
      const res = await fetch(
        `${config.url}/commandes/${commande_id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.token}`,
          },
        }
      );
      const body = await res.json();
      await supabase
        .from("commandes")
        .update({ statut: body.statut || "annulee" })
        .eq("id", commande_id)
        .eq("mama_id", mama_id);
      toast.success("Commande annulée");
      return { data: body };
    } catch (err) {
      setError(err);
      toast.error("Erreur annulation commande");
      return { error: err };
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    importFacturesFournisseur,
    syncCatalogue,
    envoyerCommande,
    getCommandeStatus,
    cancelCommande,
    testConnection,
  };
}
