// app/api/uploads/invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const formData = await req.formData();

    const file = formData.get("file");
    const type = formData.get("type"); // "service_event" | "part_purchase"
    const id = formData.get("id");     // uuid řádku

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Soubor (file) je povinný." },
        { status: 400 }
      );
    }

    if (type !== "service_event" && type !== "part_purchase") {
      return NextResponse.json(
        { error: "Neplatný typ. Musí být 'service_event' nebo 'part_purchase'." },
        { status: 400 }
      );
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Chybí ID záznamu." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${type}/${id}/${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload faktury do bucketu 'invoices' selhal:", uploadError);
      return NextResponse.json(
        {
          error:
            "Nepodařilo se nahrát soubor do Storage: " +
            (uploadError.message ?? "Neznámá chyba."),
        },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("invoices").getPublicUrl(uploadData.path);

    let updateError = null;

    if (type === "service_event") {
      const { error } = await supabase
        .from("service_events")
        .update({ invoice_url: publicUrl })
        .eq("id", id);
      updateError = error;
    } else {
      const { error } = await supabase
        .from("part_purchases")
        .update({ invoice_url: publicUrl })
        .eq("id", id);
      updateError = error;
    }

    if (updateError) {
      console.error(
        "Uložení invoice_url do tabulky selhalo:",
        updateError
      );
      return NextResponse.json(
        { error: "Soubor se nahrál, ale nepodařilo se uložit URL faktury." },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoice_url: publicUrl });
  } catch (e) {
    console.error("Neočekávaná chyba v POST /api/uploads/invoice:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
