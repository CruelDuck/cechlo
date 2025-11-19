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
      return NextResponse.json(
        { error: "Kontakt nenalezen." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (e: any) {
    console.error("Unexpected GET /api/customers/[id] error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}

// PATCH = update
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const form = await req.formData();

    const updateData: any = {
      name: form.get("name") || null,
      phone: form.get("phone") || null,
      email: form.get("email") || null,
      street: form.get("street") || null,
      city: form.get("city") || null,
      zip: form.get("zip") || null,
      country: form.get("country") || null,
      status: form.get("status") || "lead",
      note: form.get("note") || null,
      next_action_at: form.get("next_action_at") || null,
      is_hot: form.get("is_hot") ? true : false,
    };

    const { error } = await supabase
      .from("customers")
      .update(updateData)
      .eq("id", params.id);

    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Chyba při ukládání." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/customers/[id] error:", err);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
