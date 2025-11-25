// app/api/part-purchases/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";

// PATCH: úprava nákupu ND (hlavně cena / množství / poznámka)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json().catch(() => ({}));

    const {
      purchased_at,
      quantity,
      unit_price,
      currency,
      note,
    } = body as {
      purchased_at?: string | null;
      quantity?: number | string | null;
      unit_price?: number | string | null;
      currency?: string | null;
      note?: string | null;
    };

    const patchData: any = {};

    if (purchased_at !== undefined) {
      patchData.purchased_at =
        purchased_at || new Date().toISOString().slice(0, 10);
    }

    if (quantity !== undefined) {
      if (quantity === null || quantity === "") {
        patchData.quantity = 1;
      } else {
        const q = Number(quantity);
        if (Number.isNaN(q) || q <= 0) {
          return NextResponse.json(
            { error: "Množství musí být kladné číslo." },
            { status: 400 }
          );
        }
        patchData.quantity = q;
      }
    }

    if (unit_price !== undefined) {
      if (unit_price === null || unit_price === "") {
        return NextResponse.json(
          { error: "Cena dílu musí být vyplněná." },
          { status: 400 }
        );
      }
      const p = Number(unit_price);
      if (Number.isNaN(p) || p < 0) {
        return NextResponse.json(
          { error: "Cena musí být číslo větší nebo rovno nule." },
          { status: 400 }
        );
      }
      patchData.unit_price = p;
    }

    if (currency !== undefined) {
      patchData.currency = currency || "CZK";
    }

    if (note !== undefined) {
      patchData.note = note || null;
    }

    const { data, error } = await supabase
      .from("customer_part_purchases")
      .update(patchData)
      .eq("id", params.id)
      .select(
        `
        id,
        created_at,
        updated_at,
        customer_id,
        part_id,
        service_event_id,
        purchased_at,
        quantity,
        unit_price,
        currency,
        note,
        part:parts (
          id,
          part_number,
          name,
          category
        )
      `
      )
      .single();

    if (error) {
      console.error("PATCH /api/part-purchases/[id] error:", error);
      return NextResponse.json(
        { error: "Nepodařilo se upravit nákup náhradního dílu." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Unexpected PATCH /api/part-purchases/[id] error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}

// DELETE: smazání nákupu ND
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { error } = await supabase
      .from("customer_part_purchases")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("DELETE /api/part-purchases/[id] error:", error);
      return NextResponse.json(
        { error: "Nepodařilo se smazat nákup náhradního dílu." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Unexpected DELETE /api/part-purchases/[id] error:", e);
    return NextResponse.json(
      { error: "Interní chyba serveru." },
      { status: 500 }
    );
  }
}
