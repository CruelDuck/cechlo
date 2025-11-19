// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // Tohle se zaloguje ve Vercel logs, kdyby bylo něco špatně s env
  console.error("Missing Supabase env variables");
}

export function createSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
