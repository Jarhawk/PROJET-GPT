import supabaseDefault, { supabase as namedSupabase } from './supabaseClient'
const supabase = namedSupabase ?? supabaseDefault
export default supabase
export { supabase }
