// app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const role = searchParams.get("role") ?? "all"; // all | customer | supplier

  let query = supabase
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
    .order("name", { ascending: true });

  if (role === "customer") {
    query = query.eq("is_customer", true);
  } else if (role === "supplier") {
    query = query.eq("is_supplier", true);
  }

  if (q) {
    query = query.or(
      [
        `name.ilike.%${q}%`,
        `city.ilike.%${q}%`,
        `email.ilike.%${q}%`,
        `phone.ilike.%${q}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst zákazníky." },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const body = await req.json().catch(() => null);

  if (!body || !body.name?.trim()) {
    return NextResponse.json(
      { error: "Jméno / název je povinné." },
      { status: 400 }
    );
  }

  const payload = {
    name: body.name.trim(),
    type: body.type === "company" ? "company" : "person",
    contact_person: body.contact_person?.trim() || null,
    email: body.email?.trim() || null,
    email_secondary: body.email_secondary?.trim() || null,
    phone: body.phone?.trim() || null,
    phone_normalized: body.phone_normalized?.trim() || null,
    website: body.website?.trim() || null,
    street: body.street?.trim() || null,
    city: body.city?.trim() || null,
    zip: body.zip?.trim() || null,
    country: body.country?.trim() || "Česko",
    ico: body.ico?.trim() || null,
    dic: body.dic?.trim() || null,
    payment_due_days:
      body.payment_due_days === "" || body.payment_due_days == null
        ? null
        : Number(body.payment_due_days),
    is_customer: body.is_customer ?? true,
    is_supplier: body.is_supplier ?? false,
    status: body.status?.trim() || "active",
    note: body.note?.trim() || null,
    next_action_at:
      body.next_action_at === "" || body.next_action_at == null
        ? null
        : body.next_action_at,
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nepodařilo se vytvořit zákazníka." },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
