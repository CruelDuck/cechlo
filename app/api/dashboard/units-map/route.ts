// app/api/dashboard/units-map/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("units")
    .select(
      `
      id,
      serial_number,
      model,
      sale_date,
      customer:customers (
        id,
        name,
        city,
        lat,
        lng
      )
    `
    )
    .eq("status", "sold")
    .not("customer_id", "is", null)
    .not("customer.lat", "is", null)
    .not("customer.lng", "is", null);

  if (error) {
    console.error("GET /api/dashboard/units-map error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst vozíky pro mapu." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    (data ?? []).map((u) => ({
      id: u.id,
      serial_number: u.serial_number,
      model: u.model,
      sale_date: u.sale_date,
      customer_id: u.customer?.id ?? null,
      customer_name: u.customer?.name ?? null,
      city: u.customer?.city ?? null,
      lat: u.customer?.lat ?? null,
      lng: u.customer?.lng ?? null,
    }))
  );
}
