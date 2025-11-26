// app/api/units/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// GET – seznam vozíků
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
        prep_status,
        customer:customers (
          id,
          name,
          city
        )
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

    const mapped =
      (data ?? []).map((row: any) => {
        const rawCustomer = row.customer;
        const customer = Array.isArray(rawCustomer)
          ? rawCustomer[0] ?? null
          : rawCustomer ?? null;

        return {
          id: row.id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          product_model_id: row.product_model_id,
          serial_number: row.serial_number,
          status: row.status,
          warehouse_location: row.warehouse_location,
          customer_id: row.customer_id,
          purchase_price: row.purchase_price,
          purchase_currency: row.purchase_currency,
          purchase_date: row.purchase_date,
          sale_id: row.sale_id,
          sale_date: row.sale_date,
          sale_price: row.sale_price,
          currency: row.currency,
          note: row.note,
          model: row.model,
          prep_status: row.prep_status,
          customer_city: customer?.city ?? null,
          customer_name: customer?.name ?? null,
        };
      }) ?? [];

    return NextResponse.json(mapped);
  } catch (e) {
    console.error("GET /api/units unexpected error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}

// POST – vytvoření nového vozíku z formuláře /units/new
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const formData = await req.formData();

    const serial_number = String(formData.get("serial_number") ?? "").trim();
    const modelRaw = formData.get("model");
    const noteRaw = formData.get("note");

    if (!serial_number) {
      return NextResponse.json(
        { error: "Sériové číslo je povinné." },
        { status: 400 }
      );
    }

    const model =
      typeof modelRaw === "string" && modelRaw.trim() !== ""
        ? modelRaw.trim()
        : null;

    const note =
      typeof noteRaw === "string" && noteRaw.trim() !== ""
        ? noteRaw
        : null;

    const insertPayload: any = {
      serial_number,
      model,
      note,
      status: "in_stock",
      prep_status: "not_assembled",
      currency: "CZK",
      purchase_currency: "CZK",
    };

    const { data, error } = await supabase
      .from("units")
      .insert(insertPayload)
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
        prep_status,
        customer:customers (
          id,
          name,
          city
        )
      `
      )
      .single();

    if (error) {
      console.error("POST /api/units error:", error);

      if ((error as any).code === "23505") {
        return NextResponse.json(
          { error: "Vozík se stejným sériovým číslem už existuje." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Nepodařilo se uložit vozík." },
        { status: 500 }
      );
    }

    const rawCustomer = (data as any).customer;
    const customer = Array.isArray(rawCustomer)
      ? rawCustomer[0] ?? null
      : rawCustomer ?? null;

    const mapped = {
      id: data.id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      product_model_id: data.product_model_id,
      serial_number: data.serial_number,
      status: data.status,
      warehouse_location: data.warehouse_location,
      customer_id: data.customer_id,
      purchase_price: data.purchase_price,
      purchase_currency: data.purchase_currency,
      purchase_date: data.purchase_date,
      sale_id: data.sale_id,
      sale_date: data.sale_date,
      sale_price: data.sale_price,
      currency: data.currency,
      note: data.note,
      model: data.model,
      prep_status: data.prep_status,
      customer_city: customer?.city ?? null,
      customer_name: customer?.name ?? null,
    };

    return NextResponse.json(mapped, { status: 201 });
  } catch (e) {
    console.error("POST /api/units unexpected error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
