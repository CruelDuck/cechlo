import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

type CustomerStatus =
  | "lead"
  | "qualified"
  | "negotiation"
  | "proposal"
  | "won"
  | "lost"
  | "customer";

function isValidStatus(value: unknown): value is CustomerStatus {
  return (
    value === "lead" ||
    value === "qualified" ||
    value === "negotiation" ||
    value === "proposal" ||
    value === "won" ||
    value === "lost" ||
    value === "customer"
  );
}

function getSupabase() {
  return createRouteHandlerClient({
    cookies,
  });
}

// ------- GET /api/customers  – seznam kontaktů -------
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const url = new URL(req.url);
    const statusRaw = url.searchParams.get("status");

    let query = supabase
      .from("customers")
      .select("id, name, city, phone, status")
      .order("created_at", { ascending: false });

    if (statusRaw && isValidStatus(statusRaw)) {
      query = query.eq("status", statusRaw);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase GET /customers error:", error);
      return NextResponse.json(
        { error: error.message ?? "Chyba při načítání kontaktů." },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error("Unexpected error in GET /api/customers:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru při načítání kontaktů." },
      { status: 500 }
    );
  }
}

// ------- POST /api/customers  – vytvoření kontaktu -------
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const name = String(form.get("name") || "").trim();
    const statusRaw = form.get("status") ?? "lead";
    const phone = (form.get("phone") as string | null) || null;
    const email = (form.get("email") as string | null) || null;
    const city = (form.get("city") as string | null) || null;
    const next_action_at =
      (form.get("next_action_at") as string | null) || null;
    const note = (form.get("note") as string | null) || null;
    const is_hot = form.get("is_hot") ? true : false;

    if (!name) {
      return NextResponse.json(
        { error: "Jméno je povinné." },
        { status: 400 }
      );
    }

    const statusCandidate =
      typeof statusRaw === "string" ? statusRaw : "lead";
    const status: CustomerStatus = isValidStatus(statusCandidate)
      ? statusCandidate
      : "lead";

    const supabase = getSupabase();

    const { error } = await supabase.from("customers").insert([
      {
        name,
        status,
        phone,
        email,
        city,
        next_action_at,
        note,
        is_hot,
      },
    ]);

    if (error) {
      console.error("Supabase INSERT /customers error:", error);
      return NextResponse.json(
        { error: error.message ?? "Chyba při ukládání do databáze." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error in POST /api/customers:", err);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
