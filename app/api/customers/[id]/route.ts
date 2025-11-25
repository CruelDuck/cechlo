// app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("customers")
    .select(
      `
      id,
      name,
      type,
      contact_person,
      email,
      email_secondary,
      phone,
      phone_normalized,
      website,
      street,
      city,
      zip,
      country,
      ico,
      dic,
      payment_due_days,
      is_customer,
      is_supplier,
      status,
      note,
      next_action_at
    `
    )
    .eq("id", params.id)
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Zákazníka se nepodařilo načíst." },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer();
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: "Chybí data pro aktualizaci." },
      { status: 400 }
    );
  }

  const payload: any = {};

  const assignText = (field: string) => {
    if (field in body) {
      const value = body[field];
      payload[field] =
        value === "" || value == null ? null : String(value).trim();
    }
  };

  assignText("name");
  assignText("contact_person");
  assignText("email");
  assignText("email_secondary");
  assignText("phone");
  assignText("phone_normalized");
  assignText("website");
  assignText("street");
  assignText("city");
  assignText("zip");
  assignText("country");
  assignText("ico");
  assignText("dic");
  assignText("note");

  if ("type" in body) {
    payload.type = body.type === "company" ? "company" : "person";
  }

  if ("payment_due_days" in body) {
    const v = body.payment_due_days;
    payload.payment_due_days =
      v === "" || v == null ? null : Number(v);
  }

  if ("is_customer" in body) {
    payload.is_customer = Boolean(body.is_customer);
  }

  if ("is_supplier" in body) {
    payload.is_supplier = Boolean(body.is_supplier);
  }

  if ("status" in body) {
    const v = body.status;
    payload.status =
      v === "" || v == null ? "active" : String(v).trim();
  }

  if ("next_action_at" in body) {
    const v = body.next_action_at;
    payload.next_action_at = v === "" || v == null ? null : v;
  }

  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nepodařilo se uložit změny zákazníka." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer();

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nepodařilo se smazat zákazníka." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
