// app/api/dashboard/units-map/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// ruční mapování PSČ -> souřadnice (přidej / uprav podle svých zákazníků)
const ZIP_COORDS: Record<
  string,
  {
    lat: number;
    lng: number;
  }
> = {
  // příklady – uprav / doplň
  "41108": { lat: 50.452, lng: 14.374 }, // Štětí
  "53401": { lat: 50.065, lng: 15.987 }, // Holice
  "19000": { lat: 50.11, lng: 14.50 },   // Praha 9
  "38601": { lat: 49.26, lng: 13.91 },   // Strakonice
  "41723": { lat: 50.66, lng: 13.73 },   // Košťany
  "34815": { lat: 49.74, lng: 12.67 },   // Chodský Újezd
  "44001": { lat: 50.35, lng: 13.80 },   // Louny
  "40502": { lat: 50.78, lng: 14.21 },   // Děčín
  // sem postupně přidávej další PSČ, jak budeš chtít vozíky na mapě
};

export async function GET(_req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from("units")
      .select(
        `
        id,
        serial_number,
        model,
        sale_date,
        status,
        customer:customers (
          id,
          name,
          city,
          zip
        )
      `
      )
      .eq("status", "sold"); // jen prodané vozíky

    if (error) {
      console.error("GET /api/dashboard/units-map error:", error);
      return NextResponse.json(
        { error: "Nepodařilo se načíst data pro mapu." },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as any[];

    const points = rows
      .map((u) => {
        const customer = u.customer as
          | {
              id: string;
              name: string;
              city: string | null;
              zip: string | null;
            }
          | null
          | undefined;

        const zipRaw = customer?.zip ?? "";
        const zip = zipRaw ? String(zipRaw).trim() : "";
        if (!zip) {
          return null;
        }

        const coords = ZIP_COORDS[zip];
        if (!coords) {
          // PSČ zatím nemáme v mapě, tak bod nevracíme
          return null;
        }

        return {
          id: u.id as string,
          serial_number: u.serial_number as string,
          model: (u.model as string | null) ?? null,
          sale_date: (u.sale_date as string | null) ?? null,
          customer_id: customer?.id ?? null,
          customer_name: customer?.name ?? null,
          city: customer?.city ?? null,
          zip,
          lat: coords.lat,
          lng: coords.lng,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    return NextResponse.json(points);
  } catch (e) {
    console.error("Unexpected /api/dashboard/units-map error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru při načítání mapy." },
      { status: 500 }
    );
  }
}
