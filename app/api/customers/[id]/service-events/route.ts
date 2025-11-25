import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const customerId = params.id;

  const { data, error } = await supabase
    .from("service_events")
    .select(
      `
        id,
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
        vat_rate,
        unit:units(
          id,
          serial_number,
          model
        )
      `
    )
    .eq("customer_id", customerId)
    .order("performed_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst servisní historii." },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const customerId = params.id;

  const body = await req.json().catch(() => null);
  if (!body || !body.title) {
    return NextResponse.json(
      { error: "Název servisního zásahu je povinný." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("service_events")
    .insert({
      customer_id: customerId,
      unit_id: body.unit_id || null,
      performed_at: body.performed_at || null,
      title: body.title,
      description: body.description || null,
      type: body.type || null,
      labor_cost: body.labor_cost || null,
      material_cost: body.material_cost || null,
      total_cost: body.total_cost || null,
      currency: body.currency || "CZK",
      note: body.note || null,
      vat_rate: body.vat_rate ?? 21,
    })
    .select(
      `
        id,
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
        vat_rate,
        unit:units(
          id,
          serial_number,
          model
        )
      `
    )
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nepodařilo se uložit servisní zásah." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
