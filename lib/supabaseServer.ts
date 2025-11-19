// lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
// import type { Database } from '@/lib/database.types'; // až budeš mít vygenerované typy

export function createSupabaseServerClient() {
  // createServerComponentClient si s cookies poradí sám
  return createServerComponentClient({
    cookies,
  });
}
