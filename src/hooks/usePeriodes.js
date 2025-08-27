// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function usePeriodes() {
  const { mama_id } = useAuth();
  const [periodes, setPeriodes] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchPeriodes() {
    setLoading(true);
    setError(null);
    setLoading(false);
    setPeriodes([]);
    setCurrent(null);
    return [];
  }

  async function createPeriode() {
    return { error: new Error('Périodes comptables non supportées') };
  }

  async function cloturerPeriode() {
    return { error: new Error('Périodes comptables non supportées') };
  }

  async function checkCurrentPeriode() {
    return { data: true };
  }

  return {
    periodes,
    current,
    loading,
    error,
    fetchPeriodes,
    createPeriode,
    cloturerPeriode,
    checkCurrentPeriode,
  };
}
