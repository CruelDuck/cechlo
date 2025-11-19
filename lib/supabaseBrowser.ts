// lib/supabaseBrowser.ts
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
// import type { Database } from '@/lib/database.types'; // až budeš mít typy z Supabase

// Pro jednoduchost bez typů, helper si vezme URL a key z env proměnných
export const supabaseBrowser = createBrowserSupabaseClient();
