"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
  const searchParams = useSearchParams();
  const router = useRouter();

  const [parts, setParts] = useState<PartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>(
    searchParams.get("q") ?? ""
  );
  const [category, setCategory] = useState<string>(
    searchParams.get("category") ?? "all"
  );

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (search.trim() !== "") params.set("q", search.trim());
        if (category && category !== "all")
          params.set("category", category);

        const qs = params.toString();
        const res = await fetch(`/api/parts${qs ? `?${qs}` : ""}`);

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(
            payload?.error ?? "Nepodařilo se načíst náhradní díly."
          );
          setParts([]);
        } else {
          const data = (await res.json()) as PartRow[];
          setParts(data);
        }
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání náhradních dílů.");
        setParts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  function applyFilters(newSearch: string, newCategory: string) {
    const params = new URLSearchParams();
    if (newSearch.trim() !== "") params.set("q", newSearch.trim());
    if (newCategory && newCategory !== "all")
      params.set("category", newCategory);
    const qs = params.toString();
    router.push(`/parts${qs ? `?${qs}` : ""}`);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearch(value);
    applyFilters(value, category);
  }

  function handleCategoryChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = e.target.value;
    setCategory(value);
    applyFilters(search, value);
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Náhradní díly
          </h2>
          <p className="text-sm text-gray-500">
            Přehled náhradních dílů pro vozíky včetně pozice na výkrese.
          </p>
        </div>

        {/* případně tlačítko na nový díl */}
      </header>

      <section className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Hledat podle čísla dílu, názvu nebo kategorie…"
            value={search}
            onChange={handleSearchChange}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <select
            value={category}
            onChange={handleCategoryChange}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">Všechny kategorie</option>
            <option value="EH50">EH50</option>
            {/* případně další kategorie */}
          </select>
        </div>
      </section>

      {error && (
        <div className="text-sm text-red-700 border border-red-200 bg-red-50 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="border rounded-md bg-white overflow-x-auto">
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
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="py-4 px-3 text-center text-gray-500"
                >
                  Načítám…
                </td>
              </tr>
            )}

            {!loading && parts.length === 0 && !error && (
              <tr>
                <td
                  colSpan={7}
                  className="py-4 px-3 text-center text-gray-500"
                >
                  Zatím žádné náhradní díly.
                </td>
              </tr>
            )}

            {!loading &&
              parts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-2 px-3 whitespace-nowrap">
                    {p.drawing_position ?? "-"}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {p.part_number}
                  </td>
                  <td className="py-2 px-3">{p.name}</td>
                  <td className="py-2 px-3">
                    {p.category ?? "\u2013"}
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
