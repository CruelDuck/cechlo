"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Načíst data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/customers/${params.id}`);
        if (!res.ok) {
          const payload = await res.json();
          setError(payload.error || "Chyba načítání.");
          return;
        }
        setCustomer(await res.json());
      } catch (e) {
        setError("Neočekávaná chyba.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function save(formData: FormData) {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/customers/${params.id}`, {
      method: "PATCH",
      body: formData,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error || "Uložení selhalo.");
      setSaving(false);
      return;
    }

    router.push(`/customers/${params.id}`);
    router.refresh();
  }

  if (loading) {
    return <div className="p-4 text-gray-500">Načítám…</div>;
  }

  if (error || !customer) {
    return <div className="p-4 text-red-700">{error || "Chyba"}</div>;
  }

  return (
    <main className="space-y-6">
      <h2 className="text-xl font-semibold">Upravit kontakt</h2>

      <form action={save} className="space-y-6">
        {/* NAME */}
        <div>
          <label className="block text-sm font-medium mb-1">Jméno</label>
          <input
            name="name"
            defaultValue={customer.name}
            required
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* CONTACT INFO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Telefon</label>
            <input
              name="phone"
              defaultValue={customer.phone || ""}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              defaultValue={customer.email || ""}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              defaultValue={customer.status}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="lead">Lead</option>
              <option value="qualified">Qualified</option>
              <option value="negotiation">Negotiation</option>
              <option value="proposal">Proposal</option>
              <option value="customer">Customer</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        {/* ADDRESS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ulice</label>
            <input
              name="street"
              defaultValue={customer.street || ""}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Město</label>
            <input
              name="city"
              defaultValue={customer.city || ""}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PSČ</label>
            <input
              name="zip"
              defaultValue={customer.zip || ""}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>

        {/* COUNTRY */}
        <div>
          <label className="block text-sm font-medium mb-1">Země</label>
          <input
            name="country"
            defaultValue={customer.country || "CZ"}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* HOT */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_hot"
            defaultChecked={customer.is_hot}
          />
          <label className="text-sm">🔥 HOT lead</label>
        </div>

        {/* NEXT ACTION */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Další akce
          </label>
          <input
            type="date"
            name="next_action_at"
            defaultValue={customer.next_action_at || ""}
            className="border rounded-md px-3 py-2"
          />
        </div>

        {/* NOTE */}
        <div>
          <label className="block text-sm font-medium mb-1">Poznámka</label>
          <textarea
            name="note"
            defaultValue={customer.note || ""}
            rows={4}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* SAVE BUTTON */}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-black text-white rounded-md text-sm disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit"}
        </button>
      </form>
    </main>
  );
}
