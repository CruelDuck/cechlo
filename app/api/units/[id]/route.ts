// app/api/units/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// GET detail vozíku
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from("units")
      .select(
        `
        id,
        created_at,
        updated_at,
        product_model_id,
        serial_number,
        status,
        prep_status,
        warehouse_location,
        customer_id,
        purchase_price,
        purchase_currency,
        purchase_date,
        sale_id,
        note,
        model,
        sale_date,
        sale_price,
        currency,
        vat_rate,
        invoice_path,
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
        { error: "Nepodařilo se načíst vozík." },
        { status: 500 }
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

// PATCH – update vozíku z formuláře (FormData)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const formData = await req.formData();

    const model = String(formData.get("model") ?? "");
    const status = String(formData.get("status") ?? "in_stock");
    const prep_status = String(
      formData.get("prep_status") ?? "not_assembled"
    );
    const note = (formData.get("note") as string | null) ?? null;
    const currency = String(formData.get("currency") ?? "CZK");

    const sale_price_raw = formData.get("sale_price");
    const sale_date_raw = formData.get("sale_date");

    const purchase_price_raw = formData.get("purchase_price");
    const purchase_date_raw = formData.get("purchase_date");
    const purchase_currency = String(
      formData.get("purchase_currency") ?? "CZK"
    );

    const customer_id_raw = formData.get("customer_id");
    const vat_rate_raw = formData.get("vat_rate");

    const patch: any = {
      model: model || null,
      status,
      prep_status,
      note,
      currency,
    };

    // prodej
    if (sale_price_raw !== null && sale_price_raw !== "") {
      const p = Number(sale_price_raw);
      patch.sale_price = Number.isNaN(p) ? null : p;
    } else {
      patch.sale_price = null;
    }

    if (sale_date_raw !== null && sale_date_raw !== "") {
      patch.sale_date = String(sale_date_raw);
    } else {
      patch.sale_date = null;
    }

    // nákup
    if (purchase_price_raw !== null && purchase_price_raw !== "") {
      const pp = Number(purchase_price_raw);
      patch.purchase_price = Number.isNaN(pp) ? null : pp;
    } else {
      patch.purchase_price = null;
    }

    if (purchase_date_raw !== null && purchase_date_raw !== "") {
      patch.purchase_date = String(purchase_date_raw);
    } else {
      patch.purchase_date = null;
    }

    patch.purchase_currency = purchase_currency;

    // zákazník
    if (customer_id_raw && String(customer_id_raw).trim() !== "") {
      patch.customer_id = String(customer_id_raw);
    } else {
      patch.customer_id = null;
    }

    // DPH
    if (vat_rate_raw !== null && vat_rate_raw !== "") {
      const v = Number(vat_rate_raw);
      patch.vat_rate = Number.isNaN(v) ? 21 : v;
    }

    const { data, error } = await supabase
      .from("units")
      .update(patch)
      .eq("id", params.id)
      .select(
        `
        id,
        created_at,
        updated_at,
        product_model_id,
        serial_number,
        status,
        prep_status,
        warehouse_location,
        customer_id,
        purchase_price,
        purchase_currency,
        purchase_date,
        sale_id,
        note,
        model,
        sale_date,
        sale_price,
        currency,
        vat_rate,
        invoice_path,
        customer:customers (
          id,
          name,
          city
        )
      `
      )
      .single();

    if (error) {
      console.error("PATCH /api/units/[id] error:", error);
      return NextResponse.json(
        { error: "Nepodařilo se uložit změny vozíku." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Unexpected PATCH /api/units/[id] error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
