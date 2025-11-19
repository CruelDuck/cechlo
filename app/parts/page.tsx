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
  currency: string;
};

export default function PartsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "";
  const lowStockParam = searchParams.get("lowStock") === "1";

  const [parts, setParts] = useState<PartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(qParam);
  const [lowStock, setLowStock] = useState(lowStockParam);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (qParam) params.set("q", qParam);
        if (lowStockParam) params.set("lowStock", "1");

        const query = params.toString();
        const res = await fetch(`/api/parts${query ? `?${query}` : ""}`);

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(payload?.error ?? "Nepodařilo se načíst díly.");
          setParts([]);
          return;
        }

        const data = (await res.json()) as PartRow[];
        setParts(data);
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání dílů.");
        setParts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [qParam, lowStockParam]);

  function applyFilters() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (lowStock) params.set("lowStock", "1");
    const qs = params.toString();
    router.push(`/parts${qs ? `?${qs}` : ""}`);
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
            Přehled všech komponent pro Čechlo – včetně skladového množství.
          </p>
        </div>

        <Link
          href="/parts/new"
          className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 text-sm"
        >
          + Nový díl
        </Link>
      </header>

      {/* Filtry */}
      <section className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hledat podle čísla dílu / názvu / kategorie"
          className="border rounded-md px-3 py-2 text-sm w-full sm:w-80"
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => setLowStock(e.target.checked)}
          />
          Jen nízké zásoby (≤ 1 ks)
        </label>
        <button
          type="button"
          onClick={applyFilters}
          className="px-3 py-2 border rounded-md bg-white text-sm hover:bg-gray-50"
        >
          Filtrovat
        </button>
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
                <td colSpan={6} className="p-4 text-center text-gray-500">
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
                <td className="py-2 px-3 font-mono">{p.part_number}</td>
                <td className="py-2 px-3">{p.name}</td>
                <td className="py-2 px-3">{p.category || "-"}</td>
                <td className="py-2 px-3">
                  {p.stock_qty}
                  {p.stock_qty <= 1 && (
                    <span className="ml-2 text-xs text-red-600">
                      nízký stav
                    </span>
                  )}
                </td>
                <td className="py-2 px-3">
                  {p.purchase_price != null
                    ? `${p.purchase_price} ${p.currency}`
                    : "-"}
                </td>
                <td className="py-2 px-3">
                  {p.sale_price != null
                    ? `${p.sale_price} ${p.currency}`
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
