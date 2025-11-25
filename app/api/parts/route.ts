import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from("parts")
      .select(
        `
        id,
        created_at,
        updated_at,
        part_number,
        name,
        category,
        stock_qty,
        purchase_price,
        sale_price,
        currency,
        drawing_position,
        note
      `
      )
      .order("drawing_position", { ascending: true, nullsFirst: true })
      .order("part_number", { ascending: true });

    if (error) {
      console.error("GET /api/parts error:", error);
      return NextResponse.json(
        { error: "Nepodařilo se načíst seznam náhradních dílů." },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("Unexpected GET /api/parts error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
