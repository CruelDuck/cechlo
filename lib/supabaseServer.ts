// lib/supabaseServer.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function supabaseServer(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        "Chybí NEXT_PUBLIC_SUPABASE_URL nebo NEXT_PUBLIC_SUPABASE_ANON_KEY v env proměnných."
      );
    }

    client = createClient(url, key);
  }

  return client;
}
