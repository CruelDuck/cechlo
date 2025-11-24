import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// GET /api/parts
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const q = searchParams.get("q");

    let query = supabase
      .from("parts")
      .select(
        `
        id,
        part_number,
        name,
        category,
        stock_qty,
        purchase_price,
        sale_price,
        currency,
        drawing_position
      `
      );

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (q && q.trim() !== "") {
      const like = `%${q.trim()}%`;
      query = query.or(
        `part_number.ilike.${like},name.ilike.${like},category.ilike.${like}`
      );
    }

    const { data, error } = await query
      .order("drawing_position", { ascending: true, nullsFirst: true })
      .order("part_number", { ascending: true });

    if (error) {
      console.error("GET /api/parts error:", error);
      return NextResponse.json(
        { error: "Nepodařilo se načíst náhradní díly." },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("GET /api/parts unexpected error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}

// POST /api/parts – vytvoření nového dílu (bez pozice, tu si zatím můžeš doplnit v DB)
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();

    const {
      part_number,
      name,
      category,
      stock_qty,
      purchase_price,
      sale_price,
      currency,
      note,
    } = body;

    if (!part_number || !name) {
      return NextResponse.json(
        { error: "Číslo dílu a název jsou povinné." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("parts")
      .insert([
        {
          part_number,
          name,
          category,
          stock_qty: stock_qty ?? 0,
          purchase_price,
          sale_price,
          currency: currency ?? "CZK",
          note,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("POST /api/parts error:", error);
      return NextResponse.json(
        { error: error.message ?? "Nepodařilo se vytvořit díl." },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("POST /api/parts unexpected error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
