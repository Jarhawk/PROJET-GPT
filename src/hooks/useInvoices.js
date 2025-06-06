// ✅ src/hooks/useInvoices.js
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const useInvoices = () => {
  const { mama_id } = useAuth();

  const getInvoices = async () => {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });

    if (error) {
      console.error("❌ Erreur lors du chargement des factures :", error);
      return [];
    }

    return data || [];
  };

  const createInvoice = async (data) => {
    const { error } = await supabase
      .from("invoices")
      .insert([{ ...data, mama_id }]);

    if (error) {
      console.error("❌ Erreur lors de la création de la facture :", error);
      throw error;
    }
  };

  const updateInvoice = async (id, data) => {
    const { error } = await supabase
      .from("invoices")
      .update(data)
      .eq("id", id)
      .eq("mama_id", mama_id);

    if (error) {
      console.error("❌ Erreur lors de la mise à jour de la facture :", error);
      throw error;
    }
  };

  const deleteInvoice = async (id) => {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("mama_id", mama_id);

    if (error) {
      console.error("❌ Erreur lors de la suppression de la facture :", error);
      throw error;
    }
  };

  return { getInvoices, createInvoice, updateInvoice, deleteInvoice };
};

export default useInvoices;
