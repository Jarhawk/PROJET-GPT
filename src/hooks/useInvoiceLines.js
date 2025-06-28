import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useInvoiceLines() {
  const { mama_id } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchLines(invoice_id) {
    if (!invoice_id || !mama_id) return [];
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('facture_lignes')
      .select('*, produit: products(nom, famille, unite)')
      .eq('facture_id', invoice_id)
      .eq('mama_id', mama_id)
      .order('id');
    setLoading(false);
    if (error) {
      setError(error);
      console.error('fetchLines error', error);
    }
    console.log('Fetched invoice lines', data?.length || 0);
    return data || [];
  }

  async function addLine(invoice_id, ligne) {
    if (!mama_id) return { error: 'no mama_id' };
    setLoading(true);
    setError(null);
    const { error: invErr } = await supabase
      .from('factures')
      .select('id')
      .eq('id', invoice_id)
      .eq('mama_id', mama_id)
      .single();
    if (invErr) {
      setLoading(false);
      setError(invErr);
      console.error('Invoice not found', invErr);
      return { error: invErr };
    }
    const { data, error } = await supabase
      .from('facture_lignes')
      .insert([{ ...ligne, facture_id: invoice_id, mama_id }])
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      console.error('addLine error', error);
      return { error };
    }
    console.log('Added invoice line', data?.id);
    return { data };
  }

  async function updateLine(id, fields) {
    if (!mama_id) return { error: 'no mama_id' };
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('facture_lignes')
      .update(fields)
      .eq('id', id)
      .eq('mama_id', mama_id)
      .select()
      .single();
    setLoading(false);
    if (error) {
      setError(error);
      console.error('updateLine error', error);
      return { error };
    }
    console.log('Updated invoice line', id);
    return { data };
  }

  async function deleteLine(id) {
    if (!mama_id) return { error: 'no mama_id' };
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from('facture_lignes')
      .delete()
      .eq('id', id)
      .eq('mama_id', mama_id);
    setLoading(false);
    if (error) {
      setError(error);
      console.error('deleteLine error', error);
      return { error };
    }
    console.log('Deleted invoice line', id);
    return { success: true };
  }

  return {
    loading,
    error,
    fetchLines,
    addLine,
    updateLine,
    deleteLine,
  };
}
