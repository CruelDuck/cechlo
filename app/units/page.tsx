"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type UnitStatus = "in_stock" | "sold" | "reserved" | "demo" | "scrapped";
type UnitPrepStatus = "not_assembled" | "assembled" | "ready_to_ship";

type UnitRow = {
  id: string;
  serial_number: string;
  model: string | null;
  status: UnitStatus;
  prep_status: UnitPrepStatus | null;
  sale_date: string | null;
  sale_price: number | null;
};

export default function UnitsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = (searchParams.get("status") as UnitStatus | null) || null;

  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const query = status ? `?status=${status}` : "";
        const res = await fetch(`/api/units${query}`);

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(payload?.error ?? "Nepodařilo se načíst vozíky.");
          setUnits([]);
        } else {
          const data = (await res.json()) as UnitRow[];
          setUnits(data);
        }
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání vozíků.");
        setUnits([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [status, searchParams]);

  function setFilter(newStatus: UnitStatus | null) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));

    if (!newStatus) {
      params.delete("status");
    } else {
      params.set("status", newStatus);
    }

    const qs = params.toString();
    router.push(`/units${qs ? `?${qs}` : ""}`);
  }

  function handleRowClick(id: string) {
    router.push(`/units/${id}`);
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Vozíky</h2>
          <p className="text-sm text-gray-500">
            Databáze všech vyrobených/prodaných vozíků.
          </p>
        </div>

        <Link
          href="/units/new"
          className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 text-sm"
        >
          + Nový vozík
        </Link>
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm">
          <FilterButton
            label="Vše"
            active={!status}
            onClick={() => setFilter(null)}
          />
          <FilterButton
            label="Skladem"
            active={status === "in_stock"}
            onClick={() => setFilter("in_stock")}
          />
          <FilterButton
            label="Prodáno"
            active={status === "sold"}
            onClick={() => setFilter("sold")}
          />
          <FilterButton
            label="Rezervace"
            active={status === "reserved"}
            onClick={() => setFilter("reserved")}
          />
          <FilterButton
            label="Demo"
            active={status === "demo"}
            onClick={() => setFilter("demo")}
          />
          <FilterButton
            label="Vyřazené"
            active={status === "scrapped"}
            onClick={() => setFilter("scrapped")}
          />
        </div>

        {error && (
          <div className="text-sm text-red-700 border border-red-200 bg-red-50 px-3 py-2 rounded-md">
            {error}
          </div>
        )}
      </section>

      <div className="border rounded-md bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="py-2 px-3 font-medium text-gray-700">
                Sériové číslo
              </th>
              <th className="py-2 px-3 font-medium text-gray-700">Model</th>
              <th className="py-2 px-3 font-medium text-gray-700">Stav</th>
              <th className="py-2 px-3 font-medium text-gray-700">
                Stav přípravy
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
            {!loading && !error && units.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-4 px-3 text-center text-gray-500"
                >
                  Zatím žádné vozíky.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="py-4 px-3 text-center text-gray-500"
                >
                  Načítám…
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              units.map((u) => (
                <tr
                  key={u.id}
                  className={`cursor-pointer ${
                    u.status === "sold"
                      ? "bg-green-50 hover:bg-green-100"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleRowClick(u.id)}
                >
                  <td className="py-2 px-3 whitespace-nowrap">
                    {u.serial_number}
                  </td>
                  <td className="py-2 px-3">{u.model ?? "-"}</td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium bg-gray-100 text-gray-800 border-gray-200">
                      {statusLabel(u.status)}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {u.prep_status ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${prepStatusClasses(
                          u.prep_status
                        )}`}
                      >
                        {prepStatusLabel(u.prep_status)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {u.sale_date ? u.sale_date : "-"}
                  </td>
                  <td className="py-2 px-3">
                    {u.sale_price != null ? `${u.sale_price} Kč` : "-"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full border ${
        active ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

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

function prepStatusLabel(prep: UnitPrepStatus) {
  switch (prep) {
    case "not_assembled":
      return "Nesloženo";
    case "assembled":
      return "Složeno";
    case "ready_to_ship":
      return "Připraveno k odeslání";
    default:
      return "-";
  }
}

function prepStatusClasses(prep: UnitPrepStatus) {
  switch (prep) {
    case "not_assembled":
      return "bg-red-100 text-red-800 border-red-200";
    case "assembled":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "ready_to_ship":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}
