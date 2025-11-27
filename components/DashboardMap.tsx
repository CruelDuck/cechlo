// app/api/dashboard/units-map/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

type UnitRow = {
  id: string;
  model: string | null;
  sale_date: string | null;
  customer: {
    city: string | null;
    zip: string | null;
  } | null;
};

type UnitForMap = {
  id: string;
  model: string | null;
  sale_date: string | null;
  customer_city: string | null;
  postal_code: string | null;
  lat: number;
  lng: number;
};

// jednoduchý cache uvnitř requestu
const geocodeCache = new Map<string, { lat: number; lng: number }>();

async function geocodeZip(
  zip: string
): Promise<{ lat: number; lng: number } | null> {
  const normalized = zip.replace(/\s/g, "");
  if (geocodeCache.has(normalized)) {
    return geocodeCache.get(normalized)!;
  }

  const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
    normalized
  )}&countrycodes=cz&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "cechlo-inventory/1.0 (kontakt: jakub.c@centrum.cz)",
      },
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;

    const { lat, lon } = json[0];
    const coords = { lat: parseFloat(lat), lng: parseFloat(lon) };

    geocodeCache.set(normalized, coords);
    return coords;
  } catch (e) {
    console.error("Geocoding error for ZIP", zip, e);
    return null;
  }
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from("units")
      .select(
        `
        id,
        model,
        sale_date,
        customer:customers (
          city,
          zip
        )
      `
      )
      .eq("status", "sold")
      .not("customer_id", "is", null);

    if (error) {
      console.error("/api/dashboard/units-map supabase error:", error);
      return NextResponse.json(
        { error: "Nepodařilo se načíst data pro mapu." },
        { status: 500 }
      );
    }

    // Supabase může vrátit customer jako objekt NEBO pole objektů,
    // tak si to srovnáme do našeho UnitRow.
    const rows: UnitRow[] = (data ?? []).map((u: any) => {
      const customerRaw = Array.isArray(u.customer)
        ? u.customer[0]
        : u.customer;

      return {
        id: String(u.id),
        model: u.model ?? null,
        sale_date: u.sale_date ?? null,
        customer: customerRaw
          ? {
              city:
                customerRaw.city !== undefined
                  ? customerRaw.city
                  : null,
              zip:
                customerRaw.zip !== undefined ? customerRaw.zip : null,
            }
          : null,
      };
    });

    // unikátní PSČ z customer.zip
    const zips = Array.from(
      new Set(
        rows
          .map((u) => u.customer?.zip?.replace(/\s/g, ""))
          .filter((z): z is string => !!z)
      )
    );

    const zipCoords: Record<string, { lat: number; lng: number }> = {};
    for (const zip of zips) {
      const coords = await geocodeZip(zip);
      if (coords) {
        zipCoords[zip] = coords;
      }
    }

    const result: UnitForMap[] = rows.map((u) => {
      const rawZip = u.customer?.zip ?? null;
      const key = rawZip ? rawZip.replace(/\s/g, "") : null;
      const coords = key ? zipCoords[key] ?? null : null;

      return {
        id: u.id,
        model: u.model,
        sale_date: u.sale_date,
        customer_city: u.customer?.city ?? null,
        postal_code: rawZip,
        lat: coords?.lat ?? 49.8, // fallback: střed ČR
        lng: coords?.lng ?? 15.5,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("Unexpected /api/dashboard/units-map error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
