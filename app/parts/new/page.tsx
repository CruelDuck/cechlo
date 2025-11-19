"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewPartPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/parts", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Nepodařilo se uložit díl.");
      setSaving(false);
      return;
    }

    router.push("/parts");
    router.refresh();
  }

  return (
    <main className="space-y-6 max-w-xl">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Nový díl</h2>
        <Link
          href="/parts"
          className="text-sm text-gray-600 hover:underline"
        >
          Zpět na sklad
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Číslo dílu
            </label>
            <input
              name="part_number"
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="např. WHL-FRONT-250"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Název
            </label>
            <input
              name="name"
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="např. Přední kolo 250mm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Kategorie
            </label>
            <input
              name="category"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="např. mechanika, elektro..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Stav skladu (ks)
            </label>
            <input
              name="stock_qty"
              type="number"
              step="1"
              min="0"
              defaultValue={0}
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
              name="purchase_price"
              type="number"
              step="0.01"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Prodejní cena (Kč)
            </label>
            <input
              name="sale_price"
              type="number"
              step="0.01"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Poznámka
          </label>
          <textarea
            name="note"
            rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="např. používá se jen u EH50, dodavatel XYZ..."
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
          {saving ? "Ukládám…" : "Uložit díl"}
        </button>
      </form>
    </main>
  );
}
