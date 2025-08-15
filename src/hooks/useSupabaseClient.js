import { useMemo } from 'react';
import supabase from '@/lib/supabaseClient';

export default function useSupabaseClient() {
  return useMemo(() => supabase, []);
}
