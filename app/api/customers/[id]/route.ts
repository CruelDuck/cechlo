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
      .from("customers")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("Supabase GET /customers/[id] error:", error);
      return NextResponse.json(
        { error: "Kontakt nenalezen." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (e: any) {
    console.error("Unexpected GET /customers/[id] error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
