// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useSignalements() {
  const { mama_id, user_id, loading: authLoading } = useAuth();
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSignalements = useCallback(async () => {
    if (!mama_id || authLoading) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("signalements")
        .select("id, mama_id, created_by, type, description, date, created_at")
        .eq("mama_id", mama_id)
        .order("date", { ascending: false });

      if (error) throw error;
      setSignalements(data || []);
    } catch (err) {
      console.error("❌ Erreur chargement signalements:", err.message);
      setError(err);
      setSignalements([]);
    } finally {
      setLoading(false);
    }
  }, [mama_id, authLoading]);

  useEffect(() => {
    if (!authLoading) fetchSignalements();
  }, [authLoading, fetchSignalements]);

  const addSignalement = async (newSignalement) => {
    if (!mama_id || authLoading) return;

    const { error } = await supabase
      .from("signalements")
      .insert([
        {
          ...newSignalement,
          mama_id,
          created_by: user_id,
          date: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error("❌ Erreur ajout signalement:", error.message);
      throw error;
    }

    await fetchSignalements();
  };

  return { data: signalements, loading, error, addSignalement };
}

export function useSignalement(id) {
  const [signalement, setSignalement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { mama_id, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchSignalement = async () => {
      if (!id || !mama_id || authLoading) return;
      
      try {
        const { data, error } = await supabase
          .from("signalements")
          .select("id, mama_id, created_by, type, description, date, created_at")
          .eq("id", id)
          .eq("mama_id", mama_id)
          .single();

        if (error) throw error;
        setSignalement(data);
      } catch (err) {
        console.error("❌ Erreur fetch signalement:", err.message);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSignalement();
  }, [id, mama_id, authLoading]);

  return { signalement, loading, error };
}
