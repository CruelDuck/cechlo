import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// GET /api/units/[id] – detail vozíku
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // načteme jednotku + připojeného zákazníka
    const { data, error } = await supabase
      .from("units")
      .select(
        `
        id,
        serial_number,
        model,
        status,
        prep_status,
        sale_date,
        sale_price,
        currency,
        note,
        customer_id,
        purchase_price,
        purchase_currency,
        purchase_date,
        customer:customers (
          id,
          name,
          city
        )
      `
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

// PATCH /api/units/[id] – aktualizace vozíku
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

    // stav přípravy (Nesloženo / Složeno / Připraveno k odeslání)
    const prep_status = form.get("prep_status");
    if (prep_status !== null && prep_status !== "") {
      updateData.prep_status = prep_status;
    }

    // výrobní info
    const purchase_price = form.get("purchase_price");
    const purchase_date = form.get("purchase_date");
    const purchase_currency = form.get("purchase_currency");

    if (purchase_price !== null && purchase_price !== "") {
      updateData.purchase_price = Number(purchase_price);
    } else {
      updateData.purchase_price = null;
    }

    if (purchase_date !== null && purchase_date !== "") {
      updateData.purchase_date = purchase_date;
    } else {
      updateData.purchase_date = null;
    }

    updateData.purchase_currency =
      (purchase_currency as string | null) || "CZK";

    // prodejní info
    const sale_price = form.get("sale_price");
    const sale_date = form.get("sale_date");
    const customer_id = form.get("customer_id");

    if (sale_price !== null && sale_price !== "") {
      updateData.sale_price = Number(sale_price);
    } else {
      updateData.sale_price = null;
    }

    if (sale_date !== null && sale_date !== "") {
      updateData.sale_date = sale_date;
    } else {
      updateData.sale_date = null;
    }

    updateData.customer_id =
      customer_id && String(customer_id).length > 0 ? customer_id : null;

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
