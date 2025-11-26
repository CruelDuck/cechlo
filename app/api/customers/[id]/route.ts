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

// GET /api/customers/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      type,        -- 👈 přidáno
      created_at,
      updated_at
    `
    )
    .eq("id", params.id)
    .single();

  if (error) {
    console.error("GET /api/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Zákazníka se nepodařilo načíst." },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

// PATCH /api/customers/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    type,          // 👈 přijímáme type z body
  } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Jméno / název zákazníka je povinné." },
      { status: 400 }
    );
  }

  // normalizace typu – jen "person" nebo "company"
  let normalizedType: "person" | "company" | undefined = undefined;
  if (type !== undefined) {
    const t = String(type).trim();
    if (t === "person" || t === "company") {
      normalizedType = t;
    } else if (!t) {
      // prázdný string -> radši default person
      normalizedType = "person";
    }
  }

  const updatePayload: Record<string, any> = {
    name: name.trim(),
    company:
      company !== undefined ? (company ? String(company).trim() : null) : undefined,
    email:
      email !== undefined ? (email ? String(email).trim() : null) : undefined,
    phone:
      phone !== undefined ? (phone ? String(phone).trim() : null) : undefined,
    street:
      street !== undefined ? (street ? String(street).trim() : null) : undefined,
    city: city !== undefined ? (city ? String(city).trim() : null) : undefined,
    zip: zip !== undefined ? (zip ? String(zip).trim() : null) : undefined,
    country:
      country !== undefined ? (country ? String(country).trim() : null) : undefined,
    status: status !== undefined ? String(status).trim() : undefined,
    note: note !== undefined ? (note ? String(note).trim() : null) : undefined,
    next_action_at:
      next_action_at !== undefined ? next_action_at || null : undefined,
    registration_no:
      registration_no !== undefined
        ? registration_no
          ? String(registration_no).trim()
          : null
        : undefined,
    vat_no:
      vat_no !== undefined ? (vat_no ? String(vat_no).trim() : null) : undefined,
    web: web !== undefined ? (web ? String(web).trim() : null) : undefined,
  };

  // přidáme type do payloadu jen pokud je definovaný
  if (normalizedType !== undefined) {
    updatePayload.type = normalizedType;
  }

  const { data, error } = await supabase
    .from("customers")
    .update(updatePayload)
    .eq("id", params.id)
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
      type,         -- 👈 vracíme i type
      created_at,
      updated_at
    `
    )
    .single();

  if (error) {
    console.error(
      "PATCH /api/customers/[id] error:",
      error,
      "payload:",
      updatePayload
    );
    return NextResponse.json(
      { error: "Nepodařilo se uložit změny zákazníka." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

// DELETE /api/customers/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("DELETE /api/customers/[id] error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se smazat zákazníka." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
