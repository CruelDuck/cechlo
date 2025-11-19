"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PartDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [part, setPart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [partNumber, setPartNumber] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [stockQty, setStockQty] = useState<string>("0");
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/parts/${params.id}`);

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(payload?.error ?? "Nepodařilo se načíst díl.");
          return;
        }

        const data = await res.json();
        setPart(data);
        setPartNumber(data.part_number || "");
        setName(data.name || "");
        setCategory(data.category || "");
        setStockQty(
          data.stock_qty != null ? String(data.stock_qty) : "0"
        );
        setPurchasePrice(
          data.purchase_price != null ? String(data.purchase_price) : ""
        );
        setSalePrice(
          data.sale_price != null ? String(data.sale_price) : ""
        );
        setNote(data.note || "");
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání dílu.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!part) return;

    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append("part_number", partNumber);
    formData.append("name", name);
    formData.append("category", category);
    formData.append("stock_qty", stockQty);
    formData.append("purchase_price", purchasePrice);
    formData.append("sale_price", salePrice);
    formData.append("note", note);

    const res = await fetch(`/api/parts/${part.id}`, {
      method: "PATCH",
      body: formData,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Nepodařilo se uložit změny.");
      setSaving(false);
      return;
    }

    router.refresh();
    setSaving(false);
  }

  if (loading) {
    return <div className="p-4 text-gray-500">Načítám…</div>;
  }

  if (error || !part) {
    return <div className="p-4 text-red-700">{error || "Chyba"}</div>;
  }

  return (
    <main className="space-y-6 max-w-xl">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {partNumber} – {name}
          </h2>
          <p className="text-sm text-gray-500">
            Kategorie: {category || "neuvedeno"}
          </p>
        </div>

        <Link
          href="/parts"
          className="text-sm text-gray-600 hover:underline"
        >
          Zpět na sklad
        </Link>
      </header>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Číslo dílu
            </label>
            <input
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Název
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Kategorie
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Sklad (ks)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nákupní cena (Kč)
            </label>
            <input
              type="number"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Prodejní cena (Kč)
            </label>
            <input
              type="number"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Poznámka
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="text-sm text-red-700 border border-red-200 bg-red-50 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-black text-white rounded-md text-sm disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit změny"}
        </button>
      </form>
    </main>
  );
}
