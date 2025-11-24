import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (ch === delimiter && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  result.push(current);
  return result;
}

// POST /api/parts/import – nahraje CSV a upraví stock_qty podle part_number
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Soubor nebyl nahrán." },
      { status: 400 }
    );
  }

  const text = await file.text();

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return NextResponse.json(
      { error: "Soubor neobsahuje data." },
      { status: 400 }
    );
  }

  const headerLine = lines[0];
  const delimiter = headerLine.includes(";") ? ";" : ",";

  const headers = splitCsvLine(headerLine, delimiter).map((h) => h.trim());

  const idxPartNumber = headers.indexOf("part_number");
  const idxStock = headers.indexOf("stock_qty");

  if (idxPartNumber === -1 || idxStock === -1) {
    return NextResponse.json(
      {
        error:
          "CSV musí obsahovat sloupce 'part_number' a 'stock_qty' v první řádce.",
      },
      { status: 400 }
    );
  }

  type UpdateRow = { part_number: string; stock_qty: number };

  const updates: UpdateRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line, delimiter);
    const partNumber = (cells[idxPartNumber] ?? "").trim();
    const stockRaw = (cells[idxStock] ?? "").replace(",", ".").trim();

    if (!partNumber || !stockRaw) continue;

    const stockQtyNum = Number(stockRaw);

    if (!Number.isFinite(stockQtyNum)) continue;

    updates.push({
      part_number: partNumber,
      stock_qty: Math.round(stockQtyNum),
    });
  }

  const supabase = createRouteHandlerClient({ cookies });

  let updated = 0;
  const errors: { part_number: string; message: string }[] = [];

  for (const u of updates) {
    const { error } = await supabase
      .from("parts")
      .update({ stock_qty: u.stock_qty })
      .eq("part_number", u.part_number);

    if (error) {
      console.error("Error updating part", u.part_number, error);
      errors.push({ part_number: u.part_number, message: error.message });
    } else {
      updated++;
    }
  }

  return NextResponse.json({ ok: true, updated, errors });
}
