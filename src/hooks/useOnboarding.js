// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function useOnboarding() {
  const { mama_id, user } = useAuth();
  const user_id = user?.id;

  async function fetchProgress() {
    const { data } = await supabase
      .from('etapes_onboarding')
      .select('etape, statut')
      .eq('user_id', user_id)
      .eq('mama_id', mama_id)
      .order('created_at', { ascending: true });
    return data?.[0] || null;
  }

  async function startOnboarding() {
    return supabase
      .from('etapes_onboarding')
      .insert([{ user_id, mama_id, etape: '0', statut: 'en cours' }]);
  }

  return { fetchProgress, startOnboarding };
}
