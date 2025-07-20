import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export default function useSupabaseClient() {
  return useMemo(() => supabase, []);
}
