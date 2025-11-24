import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

type UnitStatus = "in_stock" | "sold" | "reserved" | "demo" | "scrapped";

// GET /api/units – seznam vozíků
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const url = new URL(req.url);
    const status = url.searchParams.get("status") as UnitStatus | null;

let query = supabase
  .from("units")
  .select(
    "id, serial_number, model, status, prep_status, sale_date, sale_price"
  )
  .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET /api/units error:", error);
      return NextResponse.json(
        { error: error.message ?? "Chyba při načítání vozíků." },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("Unexpected GET /api/units error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}

// POST /api/units – nový vozík
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const form = await req.formData();

    const serial_number = String(form.get("serial_number") || "").trim();
    const model = (form.get("model") as string | null) || null;
    const note = (form.get("note") as string | null) || null;

    if (!serial_number) {
      return NextResponse.json(
        { error: "Sériové číslo je povinné." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("units").insert([
      {
        serial_number,
        model,
        note,
      },
    ]);

    if (error) {
      console.error("POST /api/units error:", error);
      return NextResponse.json(
        { error: error.message ?? "Chyba při ukládání vozíku." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected POST /api/units error:", err);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
