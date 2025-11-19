import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// GET /api/parts – seznam dílů
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const url = new URL(req.url);

    const q = url.searchParams.get("q");
    const lowStock = url.searchParams.get("lowStock") === "1";

    let query = supabase
      .from("parts")
      .select(
        "id, part_number, name, category, stock_qty, purchase_price, sale_price, currency"
      )
      .order("part_number", { ascending: true });

    if (q) {
      query = query.or(
        `part_number.ilike.%${q}%,name.ilike.%${q}%,category.ilike.%${q}%`
      );
    }

    if (lowStock) {
      query = query.lte("stock_qty", 1); // třeba <=1 jako "nízký stav"
    }

    const { data, error } = await query;

    if (error) {
      console.error("GET /api/parts error:", error);
      return NextResponse.json(
        { error: error.message ?? "Chyba při načítání dílů." },
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

// POST /api/parts – nový díl
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const form = await req.formData();

    const part_number = String(form.get("part_number") || "").trim();
    const name = String(form.get("name") || "").trim();
    const category = (form.get("category") as string | null) || null;
    const note = (form.get("note") as string | null) || null;

    const stock_qty_raw = form.get("stock_qty");
    const purchase_price_raw = form.get("purchase_price");
    const sale_price_raw = form.get("sale_price");

    if (!part_number || !name) {
      return NextResponse.json(
        { error: "Číslo dílu a název jsou povinné." },
        { status: 400 }
      );
    }

    const stock_qty =
      stock_qty_raw !== null && stock_qty_raw !== ""
        ? Number(stock_qty_raw)
        : 0;
    const purchase_price =
      purchase_price_raw !== null && purchase_price_raw !== ""
        ? Number(purchase_price_raw)
        : null;
    const sale_price =
      sale_price_raw !== null && sale_price_raw !== ""
        ? Number(sale_price_raw)
        : null;

    const { error } = await supabase.from("parts").insert([
      {
        part_number,
        name,
        category,
        note,
        stock_qty,
        purchase_price,
        sale_price,
      },
    ]);

    if (error) {
      console.error("POST /api/parts error:", error);
      return NextResponse.json(
        { error: error.message ?? "Chyba při ukládání dílu." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected POST /api/parts error:", err);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
