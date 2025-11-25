// app/api/customers/[id]/service-events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// GET: seznam servisních zásahů pro konkrétního zákazníka
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from("service_events")
      .select(
        `
        id,
        created_at,
        updated_at,
        customer_id,
        unit_id,
        performed_at,
        title,
        description,
        type,
        labor_cost,
        material_cost,
        total_cost,
        currency,
        note,
        unit:units (
          id,
          serial_number,
          model
        )
      `
      )
      .eq("customer_id", params.id)
      .order("performed_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/customers/[id]/service-events error:", error);
      return NextResponse.json(
        { error: "Chyba při načítání servisní historie." },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error(
      "Unexpected GET /api/customers/[id]/service-events error:",
      e
    );
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}

// POST: vytvoření nového servisního zásahu pro daného zákazníka
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json().catch(() => ({}));

    const {
      unit_id,
      performed_at,
      title,
      description,
      type,
      labor_cost,
      material_cost,
      total_cost,
      currency,
      note,
    } = body as {
      unit_id?: string | null;
      performed_at?: string | null;
      title?: string | null;
      description?: string | null;
      type?: string | null;
      labor_cost?: number | string | null;
      material_cost?: number | string | null;
      total_cost?: number | string | null;
      currency?: string | null;
      note?: string | null;
    };

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Název zásahu (title) je povinný." },
        { status: 400 }
      );
    }

    const insertData: any = {
      customer_id: params.id,
      unit_id: unit_id || null,
      title: title.trim(),
      description: description || null,
      type: type || null,
      performed_at: performed_at || new Date().toISOString().slice(0, 10),
      labor_cost:
        labor_cost !== undefined && labor_cost !== null && labor_cost !== ""
          ? Number(labor_cost)
          : null,
      material_cost:
        material_cost !== undefined &&
        material_cost !== null &&
        material_cost !== ""
          ? Number(material_cost)
          : null,
      total_cost:
        total_cost !== undefined && total_cost !== null && total_cost !== ""
          ? Number(total_cost)
          : null,
      currency: currency || "CZK",
      note: note || null,
    };

    const { data, error } = await supabase
      .from("service_events")
      .insert(insertData)
      .select(
        `
        id,
        created_at,
        updated_at,
        customer_id,
        unit_id,
        performed_at,
        title,
        description,
        type,
        labor_cost,
        material_cost,
        total_cost,
        currency,
        note,
        unit:units (
          id,
          serial_number,
          model
        )
      `
      )
      .single();

    if (error) {
      console.error("POST /api/customers/[id]/service-events error:", error);
      return NextResponse.json(
        { error: "Nepodařilo se uložit servisní zásah." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error(
      "Unexpected POST /api/customers/[id]/service-events error:",
      e
    );
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
