import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// GET /api/parts/[id] – detail dílu
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from("parts")
      .select(
        "id, part_number, name, category, stock_qty, purchase_price, sale_price, currency, note"
      )
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("GET /api/parts/[id] error:", error);
      return NextResponse.json(
        { error: "Díl nenalezen." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Unexpected GET /api/parts/[id] error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}

// PATCH /api/parts/[id] – update dílu
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updateData: any = {
      part_number,
      name,
      category,
      note,
      stock_qty,
      purchase_price,
      sale_price,
    };

    const { error } = await supabase
      .from("parts")
      .update(updateData)
      .eq("id", params.id);

    if (error) {
      console.error("PATCH /api/parts/[id] error:", error);
      return NextResponse.json(
        { error: error.message ?? "Chyba při ukládání." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected PATCH /api/parts/[id] error:", err);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
