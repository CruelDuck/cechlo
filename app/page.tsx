// app/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardMap from "@/components/DashboardMap";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  const [unitsTotalRes, unitsSoldRes, customersRes, serviceEventsRes] =
    await Promise.all([
      supabase
        .from("units")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("units")
        .select("id", { count: "exact", head: true })
        .eq("status", "sold"),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("is_customer", true),
      supabase
        .from("service_events")
        .select("id", { count: "exact", head: true }),
    ]);

  const unitsTotal = unitsTotalRes.count ?? 0;
  const unitsSold = unitsSoldRes.count ?? 0;
  const customers = customersRes.count ?? 0;
  const serviceEvents = serviceEventsRes.count ?? 0;

  const inStock = unitsTotal - unitsSold;

  return (
    <main className="space-y-8">
      {/* Úvod */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Přehled Čechlo Inventory
        </h2>
        <p className="text-sm text-gray-500">
          Rychlý přehled o vozících, zákaznících a servisu.
        </p>
      </section>

      {/* Karty se statistikami */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase text-gray-500">
            Vozíky celkem
          </p>
          <p className="mt-2 text-2xl font-semibold">{unitsTotal}</p>
          <p className="mt-1 text-xs text-gray-500">
            Evidované kusy v systému
          </p>
          <Link
            href="/units"
            className="mt-3 inline-block text-xs text-blue-600 hover:underline"
          >
            Otevřít seznam vozíků
          </Link>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase text-gray-500">
            Prodáno
          </p>
          <p className="mt-2 text-2xl font-semibold">{unitsSold}</p>
          <p className="mt-1 text-xs text-gray-500">
            Vozíky, které už jezdí u zákazníků
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase text-gray-500">
            Na skladě
          </p>
          <p className="mt-2 text-2xl font-semibold">{inStock}</p>
          <p className="mt-1 text-xs text-gray-500">
            Dostupné pro prodej / montáž
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase text-gray-500">
            Zákazníci & servis
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {customers}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Zákazníků, {serviceEvents} servisních zásahů
          </p>
          <Link
            href="/customers"
            className="mt-3 inline-block text-xs text-blue-600 hover:underline"
          >
            Otevřít kontakty
          </Link>
        </div>
      </section>

      {/* Mapa + rychlé odkazy */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-2">
<h3 className="text-sm font-semibold text-gray-800">
  Kde všude už jezdí Čechlo vozíky
</h3>
<p className="text-xs text-gray-500">
  Orientační mapa podle PSČ zákazníků s prodanými vozíky.
</p>
<DashboardMap />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">
            Rychlé akce
          </h3>
          <div className="space-y-2 rounded-lg border bg-white p-3 text-sm">
            <Link
              href="/units/new"
              className="block rounded-md border px-3 py-2 hover:bg-gray-50"
            >
              + Přidat nový vozík
            </Link>
            <Link
              href="/customers/new"
              className="block rounded-md border px-3 py-2 hover:bg-gray-50"
            >
              + Přidat nový kontakt
            </Link>
            <Link
              href="/parts"
              className="block rounded-md border px-3 py-2 hover:bg-gray-50"
            >
              Otevřít sklad náhradních dílů
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
