import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
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

    const { error: uploadError } = await supabase
      .storage
      .from("invoices")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json(
        { error: "Nepodařilo se nahrát soubor do Storage." },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase
      .storage
      .from("invoices")
      .getPublicUrl(path);

    const invoiceUrl = publicData.publicUrl;

    if (type === "service_event") {
      const { error: updateError } = await supabase
        .from("service_events")
        .update({ invoice_url: invoiceUrl })
        .eq("id", id);

      if (updateError) {
        console.error(updateError);
        return NextResponse.json(
          { error: "Soubor se nahrál, ale nepodařilo se aktualizovat servisní zásah." },
          { status: 500 }
        );
      }
    } else {
      const { error: updateError } = await supabase
        .from("part_purchases")
        .update({ invoice_url: invoiceUrl })
        .eq("id", id);

      if (updateError) {
        console.error(updateError);
        return NextResponse.json(
          { error: "Soubor se nahrál, ale nepodařilo se aktualizovat nákup dílu." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ invoice_url: invoiceUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Neočekávaná chyba při nahrávání faktury." },
      { status: 500 }
    );
  }
}
