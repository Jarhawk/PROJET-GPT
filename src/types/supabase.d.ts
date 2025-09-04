/* eslint-disable no-restricted-imports */
declare module '@/lib/supabase' {
  import type { SupabaseClient } from '@supabase/supabase-js';
  const supabase: SupabaseClient;
  export default supabase;
  export { supabase };
}
