// app/api/dashboard/units-map/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

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

    const raw = (data ?? []) as any[];

    // nejdřív si vyzobeme unikátní PSČ kvůli geokódování
    const zips = Array.from(
      new Set(
        raw
          .map((u) => {
            const customerRaw = Array.isArray(u.customer)
              ? u.customer[0]
              : u.customer;
            const zip: string | null | undefined = customerRaw?.zip;
            return zip ? zip.replace(/\s/g, "") : null;
          })
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

    const result: UnitForMap[] = raw.map((u) => {
      const customerRaw = Array.isArray(u.customer)
        ? u.customer[0]
        : u.customer;

      const city: string | null =
        customerRaw && customerRaw.city !== undefined
          ? customerRaw.city
          : null;
      const rawZip: string | null =
        customerRaw && customerRaw.zip !== undefined
          ? customerRaw.zip
          : null;

      const zipKey = rawZip ? rawZip.replace(/\s/g, "") : null;
      const coords = zipKey ? zipCoords[zipKey] ?? null : null;

      return {
        id: String(u.id),
        model: u.model ?? null,
        sale_date: u.sale_date ?? null,
        customer_city: city,
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
