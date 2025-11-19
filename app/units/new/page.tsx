"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewUnitPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/units", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Nepodařilo se uložit vozík.");
      setSaving(false);
      return;
    }

    router.push("/units");
    router.refresh();
  }

  return (
    <main className="space-y-6 max-w-lg">
      <h2 className="text-lg font-semibold">Nový vozík</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Sériové číslo
          </label>
          <input
            name="serial_number"
            required
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="např. EH50-2025-0001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input
            name="model"
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="např. EH50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Poznámka</label>
          <textarea
            name="note"
            rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="např. první série, úprava korby..."
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
          {saving ? "Ukládám…" : "Uložit vozík"}
        </button>
      </form>
    </main>
  );
}
