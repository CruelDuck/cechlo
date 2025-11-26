// app/api/service-events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// DELETE: smazání jednoho servisního zásahu
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { error } = await supabase
      .from("service_events")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("DELETE /api/service-events/[id] error:", error);
      return NextResponse.json(
        { error: "Nepodařilo se smazat servisní zásah." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Unexpected DELETE /api/service-events/[id] error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
