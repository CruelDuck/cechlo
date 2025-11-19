"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/customers/${params.id}`);

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(payload?.error || "Nepodařilo se načíst detail.");
          return;
        }

        const data = await res.json();
        setCustomer(data);
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání kontaktu.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id]);

  if (loading) {
    return <div className="p-4 text-gray-500">Načítám…</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-700">
        Chyba: {error}
      </div>
    );
  }

  if (!customer) {
    return <div className="p-4 text-gray-500">Kontakt nenalezen.</div>;
  }

  return (
    <main className="space-y-6">
      {/* HLAVIČKA */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{customer.name}</h2>
          <p className="text-sm text-gray-500">
            {customer.city || "Neznámé město"} • {customer.status}
          </p>
        </div>

        <Link
          href={`/customers/${customer.id}/edit`}
          className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 text-sm"
        >
          Upravit
        </Link>
      </header>

      {/* INFO BLOK */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="font-medium">Kontaktní údaje</h3>
          <div className="text-sm">
            <div><strong>Telefon:</strong> {customer.phone || "-"}</div>
            <div><strong>Email:</strong> {customer.email || "-"}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Adresa</h3>
          <div className="text-sm">
            <div>{customer.street || "-"}</div>
            <div>{customer.city || "-"} {customer.zip || ""}</div>
            <div>{customer.country || ""}</div>
          </div>
        </div>
      </section>

      {/* POZNÁMKA */}
      <section>
        <h3 className="font-medium mb-2">Poznámka</h3>
        <div className="rounded-md border bg-gray-50 p-3 text-sm whitespace-pre-line">
          {customer.note || "— žádná poznámka —"}
        </div>
      </section>

      {/* HOT */}
      <section>
        <h3 className="font-medium mb-2">Priorita</h3>
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm ${
            customer.is_hot
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {customer.is_hot ? "🔥 HOT lead" : "Normální priorita"}
        </span>
      </section>

      {/* DALŠÍ KROKY */}
      <section>
        <h3 className="font-medium mb-2">Další akce</h3>
        <div className="text-sm">
          {customer.next_action_at
            ? customer.next_action_at
            : "Není naplánováno"}
        </div>
      </section>
    </main>
  );
}
