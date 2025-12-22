import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In dev this will surface quickly; in prod you should set these in Vercel.
  // eslint-disable-next-line no-console
  console.warn("Supabase environment variables are not set");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



