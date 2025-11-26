import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Soubor chybí" }, { status: 400 });
  }

  const serviceEventId = params.id;

  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${serviceEventId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("invoices")
    .upload(path, file);

  if (uploadError) {
    console.error(uploadError);
    return NextResponse.json({ error: "Upload selhal" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("invoices").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("service_events")
    .update({ invoice_url: publicUrl })
    .eq("id", serviceEventId);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json({ error: "Uložení URL selhalo" }, { status: 500 });
  }

  return NextResponse.json({ invoice_url: publicUrl });
}
