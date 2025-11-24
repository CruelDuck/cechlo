import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[;"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// GET /api/parts/export – stáhne CSV seznamu dílů
export async function GET(_req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from("parts")
    .select(
      "part_number,name,category,stock_qty,purchase_price,sale_price,currency,note"
    )
    .order("part_number", { ascending: true });

  if (error) {
    console.error("Error exporting parts:", error);
    return NextResponse.json(
      { error: "Chyba při načítání dílů pro export." },
      { status: 500 }
    );
  }

  const header = [
    "part_number",
    "name",
    "category",
    "stock_qty",
    "purchase_price",
    "sale_price",
    "currency",
    "note",
  ];

  const lines = [
    header.join(";"),
    ...(data ?? []).map((row) =>
      header
        .map((key) => escapeCsvValue((row as any)[key]))
        .join(";")
    ),
  ];

  // BOM, aby to otevřel Excel správně v UTF-8
  const csv = "\ufeff" + lines.join("\r\n");

  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="parts-${today}.csv"`,
    },
  });
}
