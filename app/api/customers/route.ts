import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

async function parseBody(req: NextRequest): Promise<Record<string, any>> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await req.json()) as Record<string, any>;
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const obj: Record<string, any> = {};
    formData.forEach((value, key) => {
      obj[key] = typeof value === "string" ? value : String(value);
    });
    return obj;
  }

  try {
    return (await req.json()) as Record<string, any>;
  } catch {
    return {};
  }
}

export async function GET(_req: NextRequest) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("customers")
    .select(
      `
      id,
      name,
      company,
      email,
      phone,
      street,
      city,
      zip,
      country,
      status,
      note,
      next_action_at,
      registration_no,
      vat_no,
      web,
      created_at,
      updated_at
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst seznam zákazníků." },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  const body = await parseBody(req);

  const {
    name,
    company,
    email,
    phone,
    street,
    city,
    zip,
    country,
    status,
    note,
    next_action_at,
    registration_no,
    vat_no,
    web,
  } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Jméno / název zákazníka je povinné." },
      { status: 400 }
    );
  }

  const insertPayload = {
    name: name.trim(),
    company: company ? String(company).trim() : null,
    email: email ? String(email).trim() : null,
    phone: phone ? String(phone).trim() : null,
    street: street ? String(street).trim() : null,
    city: city ? String(city).trim() : null,
    zip: zip ? String(zip).trim() : null,
    country: country ? String(country).trim() : null,
    status: status ? String(status).trim() : "nový",
    note: note ? String(note).trim() : null,
    next_action_at: next_action_at || null,
    registration_no: registration_no ? String(registration_no).trim() : null,
    vat_no: vat_no ? String(vat_no).trim() : null,
    web: web ? String(web).trim() : null,
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(insertPayload)
    .select(
      `
      id,
      name,
      company,
      email,
      phone,
      street,
      city,
      zip,
      country,
      status,
      note,
      next_action_at,
      registration_no,
      vat_no,
      web,
      created_at,
      updated_at
    `
    )
    .single();

  if (error) {
    console.error("POST /api/customers error:", error, "payload:", insertPayload);
    return NextResponse.json(
      { error: "Nepodařilo se vytvořit zákazníka." },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
