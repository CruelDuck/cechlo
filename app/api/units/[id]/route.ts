import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from("units")
      .select(
        "id, serial_number, model, status, sale_date, sale_price, currency, note, customer_id"
      )
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("GET /api/units/[id] error:", error);
      return NextResponse.json(
        { error: "Vozík nenalezen." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Unexpected GET /api/units/[id] error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}

// PATCH /api/units/[id] – úprava (poznámka, prodejní info, status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const form = await req.formData();

    const updateData: any = {
      model: form.get("model") || null,
      status: form.get("status") || "in_stock",
      note: form.get("note") || null,
      currency: form.get("currency") || "CZK",
    };

    const sale_price = form.get("sale_price");
    const sale_date = form.get("sale_date");
    const customer_id = form.get("customer_id");

    updateData.sale_price = sale_price ? Number(sale_price) : null;
    updateData.sale_date = sale_date || null;
    updateData.customer_id = customer_id || null;

    const { error } = await supabase
      .from("units")
      .update(updateData)
      .eq("id", params.id);

    if (error) {
      console.error("PATCH /api/units/[id] error:", error);
      return NextResponse.json(
        { error: error.message ?? "Chyba při ukládání." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected PATCH /api/units/[id] error:", err);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
