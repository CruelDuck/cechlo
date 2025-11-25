"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type UnitRow = {
  id: string;
  created_at: string;
  updated_at: string | null;
  product_model_id: string | null;
  serial_number: string;
  status: string;
  warehouse_location: string | null;
  customer_id: string | null;
  purchase_price: number | null;
  purchase_currency: string | null;
  purchase_date: string | null;
  sale_id: string | null;
  sale_date: string | null;
  sale_price: number | null;
  currency: string | null;
  note: string | null;
  model: string | null;
  prep_status: string | null;
};

function normalizePrepStatus(prep: string | null): string {
  if (!prep) return "";

  const p = prep.toLowerCase();

  if (p === "neslozeno" || p === "nesloženo") return "neslozeno";
  if (p === "slozeno" || p === "složeno") return "slozeno";

  if (
    p === "pripraveno" ||
    p === "pripravene" ||
    p === "pripraveno k odeslani" ||
    p === "připraveno k odeslani" ||
    p === "připraveno k odeslání"
  ) {
    return "pripraveno";
  }

  if (p === "odeslano" || p === "odesláno") return "odeslano";

  return p;
}

function getPrepStatusLabel(prep: string | null): string {
  const p = normalizePrepStatus(prep);

  switch (p) {
    case "neslozeno":
      return "Nesloženo";
    case "slozeno":
      return "Složeno";
    case "pripraveno":
      return "Připraveno k odeslání";
    case "odeslano":
      return "Odesláno";
    default:
      return "Nespecifikováno";
  }
}

function getPrepStatusClass(prep: string | null): string {
  const p = normalizePrepStatus(prep);

  switch (p) {
    case "neslozeno":
      return "bg-red-100 text-red-800 border-red-200";
    case "slozeno":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "pripraveno":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "odeslano":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function UnitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [units, setUnits] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState<string>(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") ?? "all"
  );

  useEffect(() => {
    const qParam = searchParams.get("q") ?? "";
    const statusParam = searchParams.get("status") ?? "all";

    setQ(qParam);
    setStatusFilter(statusParam);

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (qParam.trim()) params.set("q", qParam.trim());
        if (statusParam !== "all") params.set("status", statusParam);
        const qs = params.toString();

        const res = await fetch(`/api/units${qs ? `?${qs}` : ""}`);

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(payload?.error ?? "Nepodařilo se načíst vozíky.");
          setUnits([]);
          return;
        }

        const data = (await res.json()) as UnitRow[];
        setUnits(data);
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání vozíků.");
        setUnits([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [searchParams]);

  function applyFilters(nextQ: string, nextStatus: string) {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);
    const qs = params.toString();
    router.push(`/units${qs ? `?${qs}` : ""}`);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQ(value);
    applyFilters(value, statusFilter);
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setStatusFilter(value);
    applyFilters(q, value);
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
            Přehled všech vozíků včetně stavu přípravy (Nesloženo, Složeno,
            Připraveno k odeslání, Odesláno).
          </p>
        </div>
      </header>

      {/* Filtry */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Hledat podle sériového čísla, modelu nebo poznámky…"
            value={q}
            onChange={handleSearchChange}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="all">Všechny stavy prodeje</option>
            <option value="in_stock">Na skladě</option>
            <option value="sold">Prodáno</option>
            <option value="reserved">Rezervováno</option>
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="text-sm text-gray-500">Načítám vozíky…</div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="py-2 px-3 font-medium text-gray-700">
                Stav přípravy
              </th>
              <th className="py-2 px-3 font-medium text-gray-700">
                Stav prodeje
              </th>
              <th className="py-2 px-3 font-medium text-gray-700">
                Sériové číslo
              </th>
              <th className="py-2 px-3 font-medium text-gray-700">Model</th>
              <th className="py-2 px-3 font-medium text-gray-700">
                Umístění
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
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  Zatím žádné vozíky.
                </td>
              </tr>
            )}

            {units.map((u) => {
              const isSold =
                u.status === "sold" ||
                (u.sale_date !== null && u.sale_price !== null);

              return (
                <tr
                  key={u.id}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    isSold ? "bg-green-50" : ""
                  }`}
                  onClick={() => handleRowClick(u.id)}
                >
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getPrepStatusClass(
                        u.prep_status
                      )}`}
                    >
                      {getPrepStatusLabel(u.prep_status)}
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {u.status === "sold"
                      ? "Prodáno"
                      : u.status === "reserved"
                      ? "Rezervováno"
                      : "Na skladě"}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap font-mono">
                    {u.serial_number}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {u.model ?? "–"}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {u.warehouse_location ?? "–"}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {u.sale_date ?? "–"}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-right">
                    {u.sale_price != null
                      ? `${u.sale_price} ${u.currency ?? "CZK"}`
                      : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
