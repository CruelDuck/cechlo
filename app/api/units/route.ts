// app/api/units/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q");
    const status = searchParams.get("status");

    let query = supabase
      .from("units")
      .select(
        `
        id,
        created_at,
        updated_at,
        product_model_id,
        serial_number,
        status,
        warehouse_location,
        customer_id,
        purchase_price,
        purchase_currency,
        purchase_date,
        sale_id,
        sale_date,
        sale_price,
        currency,
        note,
        model,
        prep_status
      `
      );

    if (q && q.trim() !== "") {
      const like = `%${q.trim()}%`;
      query = query.or(
        `
          serial_number.ilike.${like},
          model.ilike.${like},
          warehouse_location.ilike.${like},
          note.ilike.${like}
        `
      );
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("GET /api/units error:", error);
      return NextResponse.json(
        { error: "Nepodařilo se načíst vozíky." },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("GET /api/units unexpected error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
