// app/api/customers/[id]/part-purchases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// GET: všechny nákupy ND daného zákazníka
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from("customer_part_purchases")
      .select(
        `
        id,
        created_at,
        updated_at,
        customer_id,
        part_id,
        service_event_id,
        purchased_at,
        quantity,
        unit_price,
        currency,
        note,
        part:parts (
          id,
          part_number,
          name,
          category
        )
      `
      )
      .eq("customer_id", params.id)
      .order("purchased_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "GET /api/customers/[id]/part-purchases error:",
        error
      );
      return NextResponse.json(
        { error: "Chyba při načítání nákupů náhradních dílů." },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error(
      "Unexpected GET /api/customers/[id]/part-purchases error:",
      e
    );
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}

// POST: vytvoření nového nákupu ND
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json().catch(() => ({}));

    const {
      part_id,
      purchased_at,
      quantity,
      unit_price,
      currency,
      note,
      service_event_id,
    } = body as {
      part_id?: string;
      purchased_at?: string | null;
      quantity?: number | string | null;
      unit_price?: number | string | null;
      currency?: string | null;
      note?: string | null;
      service_event_id?: string | null;
    };

    if (!part_id) {
      return NextResponse.json(
        { error: "Náhradní díl (part_id) je povinný." },
        { status: 400 }
      );
    }

    if (unit_price === undefined || unit_price === null || unit_price === "") {
      return NextResponse.json(
        { error: "Prodejní cena dílu (unit_price) je povinná." },
        { status: 400 }
      );
    }

    const qty = quantity && quantity !== "" ? Number(quantity) : 1;
    const price = Number(unit_price);

    if (Number.isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Množství musí být kladné číslo." },
        { status: 400 }
      );
    }

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "Cena musí být číslo větší nebo rovno nule." },
        { status: 400 }
      );
    }

    const insertData: any = {
      customer_id: params.id,
      part_id,
      purchased_at: purchased_at || new Date().toISOString().slice(0, 10),
      quantity: qty,
      unit_price: price,
      currency: currency || "CZK",
      note: note || null,
      service_event_id: service_event_id || null,
    };

    const { data, error } = await supabase
      .from("customer_part_purchases")
      .insert(insertData)
      .select(
        `
        id,
        created_at,
        updated_at,
        customer_id,
        part_id,
        service_event_id,
        purchased_at,
        quantity,
        unit_price,
        currency,
        note,
        part:parts (
          id,
          part_number,
          name,
          category
        )
      `
      )
      .single();

    if (error) {
      console.error(
        "POST /api/customers/[id]/part-purchases error:",
        error
      );
      return NextResponse.json(
        { error: "Nepodařilo se uložit nákup náhradního dílu." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error(
      "Unexpected POST /api/customers/[id]/part-purchases error:",
      e
    );
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
