import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// POST /api/units/[id]/invoice
// očekává multipart/form-data s "file" – faktura
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Soubor faktury nebyl nahrán." },
        { status: 400 }
      );
    }

    const unitId = params.id;
    const origName = file.name || "invoice.pdf";

    const ext = origName.includes(".")
      ? origName.split(".").pop()
      : "pdf";

    const safeExt = ext || "pdf";

    const filePath = `unit-${unitId}/${Date.now()}-${origName.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )}`;

    // upload do storage bucketu "invoices"
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      console.error("Upload invoice error:", uploadError);
      return NextResponse.json(
        { error: "Nepodařilo se nahrát fakturu." },
        { status: 500 }
      );
    }

    // uložit cestu do units.invoice_path
    const { error: updateError } = await supabase
      .from("units")
      .update({ invoice_path: filePath })
      .eq("id", unitId);

    if (updateError) {
      console.error("Update unit invoice_path error:", updateError);
      return NextResponse.json(
        {
          error:
            "Soubor byl nahrán, ale nepodařilo se uložit odkaz v databázi.",
        },
        { status: 500 }
      );
    }

    // Vygenerovat public URL (bucket musí být public)
    const { data: publicData } = supabase.storage
      .from("invoices")
      .getPublicUrl(filePath);

    const publicUrl = publicData?.publicUrl ?? null;

    return NextResponse.json({
      ok: true,
      invoice_path: filePath,
      publicUrl,
    });
  } catch (e) {
    console.error("Unexpected invoice upload error:", e);
    return NextResponse.json(
      { error: "Interní chyba při nahrávání faktury." },
      { status: 500 }
    );
  }
}
