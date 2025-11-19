// app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

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

// jistota, že běžíme v Node runtime
export const runtime = "nodejs";

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

    const supabase = createRouteHandlerClient({
      cookies,
    });

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
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: error.message ?? "Chyba při ukládání do databáze." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error in /api/customers:", err);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
