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

  const initialQ = searchParams.get("q") ?? "";
  const initialLowStock = searchParams.get("lowStock") === "1";

  const [q, setQ] = useState(initialQ);
  const [lowStockOnly, setLowStockOnly] = useState(initialLowStock);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function loadParts(opts?: { q?: string; lowStock?: boolean }) {
    const search = opts?.q ?? q;
    const low = opts?.lowStock ?? lowStockOnly;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search.trim() !== "") params.set("q", search.trim());
    if (low) params.set("lowStock", "1");

    const res = await fetch(`/api/parts?${params.toString()}`);
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Chyba při načítání seznamu dílů.");
      setLoading(false);
      return;
    }

    const data = (await res.json()) as PartRow[];
    setParts(data);
    setLoading(false);

    // Aktualizace URL (bez reloadu)
    const urlParams = new URLSearchParams();
    if (search.trim() !== "") urlParams.set("q", search.trim());
    if (low) urlParams.set("lowStock", "1");
    const qs = urlParams.toString();
    router.replace(qs ? `/parts?${qs}` : "/parts");
  }

  useEffect(() => {
    loadParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadParts({ q, lowStock: lowStockOnly });
  }

  function toggleLowStock() {
    const newVal = !lowStockOnly;
    setLowStockOnly(newVal);
    loadParts({ q, lowStock: newVal });
  }

  function handleExport() {
    // necháme prohlížeč stáhnout CSV
    window.location.href = "/api/parts/export";
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/parts/import", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Chyba při importu CSV.");
    } else {
      const payload = await res.json().catch(() => null);
      if (payload?.errors?.length) {
        setError(
          `Import proběhl, ale některé řádky se nepodařilo aktualizovat (${payload.errors.length}).`
        );
      }
      // znovu načíst seznam
      await loadParts();
    }

    setImporting(false);
    // vyčistit input, aby šel nahrát stejný soubor znovu
    e.target.value = "";
  }

  return (
    <main className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Náhradní díly</h2>
          <p className="text-sm text-gray-500">
            Seznam ND s množstvím na skladě, nákupní a prodejní cenou.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50"
          >
            Stáhnout CSV
          </button>

          <label className="px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 cursor-pointer">
            {importing ? "Nahrávám…" : "Nahrát CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImport}
            />
          </label>

          <Link
            href="/parts/new"
            className="px-3 py-2 rounded-md border text-sm bg-gray-900 text-white hover:bg-gray-800"
          >
            + Nový díl
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row gap-2 items-start sm:items-center"
        >
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat podle čísla dílu nebo názvu…"
            className="w-full sm:w-64 border rounded-md px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50"
          >
            Hledat
          </button>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={toggleLowStock}
            />
            Jen nízký sklad
          </label>
        </form>

        <p className="text-xs text-gray-500">
          CSV export/import používá oddělovač <code>;</code> a sloupce:
          <br />
          <code>
            part_number; name; category; stock_qty; purchase_price; sale_price;
            currency; note
          </code>
          . Při importu se aktualizuje pouze{" "}
          <code>stock_qty</code> podle <code>part_number</code>.
        </p>
      </section>

      {error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-2 px-3 text-left font-medium text-gray-700">
                Číslo dílu
              </th>
              <th className="py-2 px-3 text-left font-medium text-gray-700">
                Název
              </th>
              <th className="py-2 px-3 text-left font-medium text-gray-700">
                Kategorie
              </th>
              <th className="py-2 px-3 text-right font-medium text-gray-700">
                Sklad (ks)
              </th>
              <th className="py-2 px-3 text-right font-medium text-gray-700">
                Nákupní cena
              </th>
              <th className="py-2 px-3 text-right font-medium text-gray-700">
                Prodejní cena
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-4 px-3 text-center text-gray-500">
                  Načítám…
                </td>
              </tr>
            )}

            {!loading && parts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 px-3 text-center text-gray-500">
                  Žádné díly k zobrazení.
                </td>
              </tr>
            )}

            {!loading &&
              parts.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-3 whitespace-nowrap">
                    <Link
                      href={`/parts/${p.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {p.part_number}
                    </Link>
                  </td>
                  <td className="py-2 px-3">{p.name}</td>
                  <td className="py-2 px-3">
                    {p.category ?? <span className="text-gray-400">-</span>}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {p.stock_qty ?? 0}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {p.purchase_price != null
                      ? `${p.purchase_price} ${p.currency}`
                      : "-"}
                  </td>
                  <td className="py-2 px-3 text-right">
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
