// src/hooks/useComparatif.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const useComparatif = (produitId) => {
  const { mama_id } = useAuth();
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!produitId || !mama_id) return;

      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("invoice_lines")
        .select(`
          quantite,
          total,
          pu,
          created_at,
          invoices (
            supplier_id
          ),
          suppliers (
            nom
          )
        `)
        .eq("product_id", produitId)
        .eq("mama_id", mama_id);

      if (error) {
        console.error("Erreur chargement comparatif :", error.message);
        setError("Erreur de chargement.");
        setLignes([]);
        setLoading(false);
        return;
      }

      const byFournisseur = {};
      for (const ligne of data || []) {
        const supplierId = ligne.invoices?.supplier_id;
        if (!supplierId) continue;
        if (!byFournisseur[supplierId]) byFournisseur[supplierId] = [];
        byFournisseur[supplierId].push(ligne);
      }

      const lignesFinales = Object.entries(byFournisseur).map(([_fid, achats]) => {
        const total = achats.reduce((acc, l) => acc + (l.total || 0), 0);
        const quantite = achats.reduce((acc, l) => acc + (l.quantite || 0), 0);
        const pmp = quantite ? (total / quantite).toFixed(2) : "0.00";
        const dernier = achats.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.pu?.toFixed(2);
        return {
          fournisseur: achats[0]?.suppliers?.nom || "Inconnu",
          dernierPrix: dernier || "—",
          pmp,
          nb: achats.length
        };
      });

      setLignes(lignesFinales);
      setLoading(false);
    };

    load();
  }, [produitId, mama_id]);

  return { lignes, loading, error };
};

export default useComparatif;
