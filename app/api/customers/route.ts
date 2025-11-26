// app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { searchParams } = new URL(req.url);

  const role = searchParams.get("role"); // all | customer | supplier
  const q = searchParams.get("q");       // search string

  let query = supabase
    .from("customers")
    .select(
      `
      id,
      name,
      email,
      phone,
      city,
      status,
      next_action_at,
      is_customer,
      is_supplier,
      type
    `
    )
    .order("created_at", { ascending: false });

  // filtr role (jen zákazníci / jen dodavatelé)
  if (role === "customer") {
    query = query.eq("is_customer", true);
  } else if (role === "supplier") {
    query = query.eq("is_supplier", true);
  }

  // fulltext hledání
  if (q && q.trim() !== "") {
    const like = `%${q.trim()}%`;
    query = query.or(
      `
        name.ilike.${like},
        city.ilike.${like},
        email.ilike.${like},
        phone.ilike.${like}
      `
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst zákazníky." },
      { status: 500 }
    );
  }

  // normalizace type – když je null nebo něco divného, bereme jako "person"
  const normalized =
    (data ?? []).map((c: any) => ({
      ...c,
      type: c.type === "company" ? "company" : "person",
    })) ?? [];

  return NextResponse.json(normalized);
}
