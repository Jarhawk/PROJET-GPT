// src/hooks/useFournisseurStats.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const useFournisseurStats = (fournisseurId) => {
  const { mama_id } = useAuth();
  const [stats, setStats] = useState({
    montant: 0,
    nbFactures: 0,
    notes: 0,
    signalements: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!fournisseurId || !mama_id) return;

      try {
        // Factures
        const { data: factures, error: errFactures } = await supabase
          .from("invoices")
          .select("montant")
          .eq("supplier_id", fournisseurId)
          .eq("mama_id", mama_id);

        if (errFactures) throw errFactures;

        // Notes
        const { data: notes, error: errNotes } = await supabase
          .from("notations")
          .select("note")
          .eq("fournisseur_id", fournisseurId)
          .eq("mama_id", mama_id);

        if (errNotes) throw errNotes;

        // Signalements (à adapter si tu as une vraie relation avec fournisseur)
        const { data: signalements, error: errSignals } = await supabase
          .from("signalements")
          .select("id")
          .eq("fournisseur_id", fournisseurId) // remplace produit_id si applicable
          .eq("mama_id", mama_id);

        if (errSignals) throw errSignals;

        const montant = factures?.reduce((acc, f) => acc + (f.montant || 0), 0);
        const moyenne = notes?.length
          ? (notes.reduce((acc, n) => acc + n.note, 0) / notes.length).toFixed(1)
          : "0.0";

        setStats({
          montant: montant || 0,
          nbFactures: factures?.length || 0,
          notes: moyenne,
          signalements: signalements?.length || 0,
        });
      } catch (err) {
        console.error("❌ useFournisseurStats error :", err);
        setStats({
          montant: 0,
          nbFactures: 0,
          notes: 0,
          signalements: 0,
        });
      }
    };

    fetchStats();
  }, [fournisseurId, mama_id]);

  return { stats };
};

export default useFournisseurStats;
