// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useOnboarding() {
  const { mama_id } = useAuth();

  async function fetchProgress() {
    const { data } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('mama_id', mama_id)
      .range(0, 0);
    return data?.[0] || null;
  }

  return { fetchProgress };
}
