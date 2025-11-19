import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from("units")
      .select("id, serial_number, model, status, sale_date, sale_price")
      .eq("customer_id", params.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/customers/[id]/units error:", error);
      return NextResponse.json(
        { error: error.message ?? "Chyba při načítání vozíků zákazníka." },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("Unexpected GET /api/customers/[id]/units error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
