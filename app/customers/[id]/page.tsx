"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UnitStatus = "in_stock" | "sold" | "reserved" | "demo" | "scrapped";

function statusLabel(status: UnitStatus) {
  switch (status) {
    case "in_stock":
      return "Skladem";
    case "sold":
      return "Prodáno";
    case "reserved":
      return "Rezervace";
    case "demo":
      return "Demo";
    case "scrapped":
      return "Vyřazený";
    default:
      return status;
  }
}

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/customers/${params.id}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(payload?.error || "Nepodařilo se načíst zákazníka.");
          return;
        }
        setCustomer(await res.json());
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání zákazníka.");
      } finally {
        setLoading(false);
      }
    }

    async function loadUnits() {
      try {
        setUnitsLoading(true);
        setUnitsError(null);

        const res = await fetch(`/api/customers/${params.id}/units`);
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setUnitsError(
            payload?.error || "Nepodařilo se načíst vozíky zákazníka."
          );
          return;
        }
        setUnits(await res.json());
      } catch (e) {
        console.error(e);
        setUnitsError("Neočekávaná chyba při načítání vozíků.");
      } finally {
        setUnitsLoading(false);
      }
    }

    loadCustomer();
    loadUnits();
  }, [params.id]);

  if (loading) {
    return <div className="p-4 text-gray-500">Načítám…</div>;
  }

  if (error || !customer) {
    return <div className="p-4 text-red-700">{error || "Chyba"}</div>;
  }

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{customer.name}</h2>
          <p className="text-sm text-gray-500">
            {customer.city || "Neznámé město"} • {customer.status}
          </p>
        </div>

        <Link
          href={`/customers/${customer.id}/edit`}
          className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 text-sm"
        >
          Upravit
        </Link>
      </header>

      {/* Kontaktní info */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="font-medium">Kontaktní údaje</h3>
          <div className="text-sm">
            <div>
              <strong>Telefon:</strong> {customer.phone || "-"}
            </div>
            <div>
              <strong>Email:</strong> {customer.email || "-"}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Adresa</h3>
          <div className="text-sm">
            <div>{customer.street || "-"}</div>
            <div>
              {customer.city || "-"} {customer.zip || ""}
            </div>
            <div>{customer.country || ""}</div>
          </div>
        </div>
      </section>

      {/* Poznámka */}
      <section>
        <h3 className="font-medium mb-2">Poznámka</h3>
        <div className="rounded-md border bg-gray-50 p-3 text-sm whitespace-pre-line">
          {customer.note || "— žádná poznámka —"}
        </div>
      </section>

      {/* Vozíky zákazníka */}
      <section className="space-y-2">
        <h3 className="font-medium">Vozíky tohoto zákazníka</h3>

        {unitsLoading && (
          <p className="text-sm text-gray-500">Načítám vozíky…</p>
        )}

        {unitsError && (
          <p className="text-sm text-red-700">{unitsError}</p>
        )}

        {!unitsLoading && !unitsError && units.length === 0 && (
          <p className="text-sm text-gray-500">
            Tento zákazník zatím nemá žádné přiřazené vozíky.
          </p>
        )}

        {!unitsLoading && !unitsError && units.length > 0 && (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left">
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Sériové číslo
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Model
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Stav
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Datum prodeje
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Prodejní cena
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {units.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/units/${u.id}`)}
                  >
                    <td className="py-2 px-3">
                      {u.serial_number}
                    </td>
                    <td className="py-2 px-3">
                      {u.model || "-"}
                    </td>
                    <td className="py-2 px-3">
                      {statusLabel(u.status)}
                    </td>
                    <td className="py-2 px-3">
                      {u.sale_date || "-"}
                    </td>
                    <td className="py-2 px-3">
                      {u.sale_price != null
                        ? `${u.sale_price} Kč`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
