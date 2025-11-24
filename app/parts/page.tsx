"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type PartRow = {
  id: string;
  part_number: string;
  name: string;
  category: string | null;
  stock_qty: number;
  purchase_price: number | null;
  sale_price: number | null;
  currency: string | null;
  drawing_position: number | null;
};

export default function PartsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [parts, setParts] = useState<PartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState<string>(searchParams.get("q") ?? "");
  const [lowStock, setLowStock] = useState<boolean>(
    searchParams.get("lowStock") === "1"
  );

  // načítání dat vždy, když se změní query v URL
  useEffect(() => {
    const qParam = searchParams.get("q") ?? "";
    const lowStockParam = searchParams.get("lowStock") === "1";

    setQ(qParam);
    setLowStock(lowStockParam);

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (qParam.trim()) params.set("q", qParam.trim());
        if (lowStockParam) params.set("lowStock", "1");
        const qs = params.toString();

        const res = await fetch(`/api/parts${qs ? `?${qs}` : ""}`);

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(
            payload?.error ?? "Nepodařilo se načíst náhradní díly."
          );
          setParts([]);
          return;
        }

        const data = (await res.json()) as PartRow[];
        setParts(data);
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání náhradních dílů.");
        setParts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [searchParams]); // když se změní URL (q / lowStock), znovu načti

  function applyFilters(nextQ: string, nextLowStock: boolean) {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextLowStock) params.set("lowStock", "1");
    const qs = params.toString();
    router.push(`/parts${qs ? `?${qs}` : ""}`);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQ(value);
    applyFilters(value, lowStock);
  }

  function handleLowStockChange(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setLowStock(checked);
    applyFilters(q, checked);
  }

  function handleRowClick(id: string) {
    router.push(`/parts/${id}`);
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Sklad dílů
          </h2>
          <p className="text-sm text-gray-500">
            Přehled náhradních dílů pro vozíky – včetně pozice na výkrese a
            skladového množství.
          </p>
        </div>

        <Link
          href="/parts/new"
          className="inline-flex items-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Přidat nový díl
        </Link>
      </header>

      {/* Filtry */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Hledat podle čísla dílu, názvu nebo kategorie…"
            value={q}
            onChange={handleSearchChange}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={handleLowStockChange}
          />
          <span>Jen nízký stav (≤ 1 ks)</span>
        </label>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="text-sm text-gray-500">Načítám díly…</div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="py-2 px-3 font-medium text-gray-700">
                Pozice
              </th>
              <th className="py-2 px-3 font-medium text-gray-700">
                Číslo dílu
              </th>
              <th className="py-2 px-3 font-medium text-gray-700">
                Název
              </th>
              <th className="py-2 px-3 font-medium text-gray-700">
                Kategorie
              </th>
              <th className="py-2 px-3 font-medium text-gray-700">
                Sklad (ks)
              </th>
              <th className="py-2 px-3 font-medium text-gray-700">
                Nákupní cena
              </th>
              <th className="py-2 px-3 font-medium text-gray-700">
                Prodejní cena
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!loading && !error && parts.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-4 text-center text-gray-500"
                >
                  Zatím žádné díly.
                </td>
              </tr>
            )}

            {parts.map((p) => (
              <tr
                key={p.id}
                className={`hover:bg-gray-50 cursor-pointer ${
                  p.stock_qty <= 1 ? "bg-red-50" : ""
                }`}
                onClick={() => handleRowClick(p.id)}
              >
                <td className="py-2 px-3 whitespace-nowrap">
                  {p.drawing_position ?? "-"}
                </td>
                <td className="py-2 px-3 font-mono">{p.part_number}</td>
                <td className="py-2 px-3">{p.name}</td>
                <td className="py-2 px-3">
                  {p.category ? p.category : "–"}
                </td>
                <td className="py-2 px-3 text-right">
                  {p.stock_qty}
                </td>
                <td className="py-2 px-3 text-right">
                  {p.purchase_price != null
                    ? `${p.purchase_price} ${p.currency ?? "CZK"}`
                    : "-"}
                </td>
                <td className="py-2 px-3 text-right">
                  {p.sale_price != null
                    ? `${p.sale_price} ${p.currency ?? "CZK"}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
