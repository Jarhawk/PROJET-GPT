// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

export function useInventaireZones() {
  const { mama_id } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getZones() {
    if (!mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("inventaire_zones")
      .select("*")
      .eq("mama_id", mama_id)
      .order("nom", { ascending: true });
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
      return [];
    }
    setZones(Array.isArray(data) ? data : []);
    return data || [];
  }

  async function createZone(zone) {
    if (!mama_id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("inventaire_zones")
      .insert([{ ...zone, mama_id }]);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    } else {
      await getZones();
    }
  }

  async function updateZone(id, fields) {
    if (!mama_id || !id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("inventaire_zones")
      .update(fields)
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    } else {
      await getZones();
    }
  }

  async function deleteZone(id) {
    if (!mama_id || !id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("inventaire_zones")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      toast.error(error.message);
    } else {
      await getZones();
    }
  }

  return {
    zones,
    loading,
    error,
    getZones,
    createZone,
    updateZone,
    deleteZone,
  };
}
