"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type Status =
  | "lead"
  | "qualified"
  | "negotiation"
  | "proposal"
  | "won"
  | "lost"
  | "customer";

type CustomerRow = {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  status: Status;
};

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = (searchParams.get("status") as Status | null) || null;

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const query = status ? `?status=${status}` : "";
        const res = await fetch(`/api/customers${query}`);

        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(payload?.error ?? "Nepodařilo se načíst kontakty.");
          setCustomers([]);
        } else {
          const data = (await res.json()) as CustomerRow[];
          setCustomers(data);
        }
      } catch (e) {
        console.error("Fetch /api/customers error:", e);
        setError("Neočekávaná chyba při načítání kontaktů.");
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [status]);

  function setFilter(newStatus: Status | null) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (!newStatus) {
      params.delete("status");
    } else {
      params.set("status", newStatus);
    }

    const qs = params.toString();
    router.push(`/customers${qs ? `?${qs}` : ""}`);
  }

  function handleRowClick(id: string) {
    router.push(`/customers/${id}`);
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Kontakty</h2>
          <p className="text-sm text-gray-500">
            Kompletní seznam všech kontaktů a leadů.
          </p>
        </div>

        <Link
          href="/customers/new"
          className="px-4 py-2 rounded-md border text-sm font-medium bg-white hover:bg-gray-50"
        >
          + Nový kontakt
        </Link>
      </header>

      {/* Filtry */}
      <div className="flex items-center gap-2 text-sm">
        <FilterButton
          label="Všichni"
          active={!status}
          onClick={() => setFilter(null)}
        />
        <FilterButton
          label="Lead"
          active={status === "lead"}
          onClick={() => setFilter("lead")}
        />
        <FilterButton
          label="Qualified"
          active={status === "qualified"}
          onClick={() => setFilter("qualified")}
        />
        <FilterButton
          label="Negotiation"
          active={status === "negotiation"}
          onClick={() => setFilter("negotiation")}
        />
        <FilterButton
          label="Customer"
          active={status === "customer"}
          onClick={() => setFilter("customer")}
        />
      </div>

      {/* Chyba */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="text-sm text-gray-500">Načítám kontakty…</div>
      )}

      {/* Tabulka */}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="py-2 px-3 font-medium text-gray-700">Jméno</th>
              <th className="py-2 px-3 font-medium text-gray-700">Město</th>
              <th className="py-2 px-3 font-medium text-gray-700">Telefon</th>
              <th className="py-2 px-3 font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!loading && !error && customers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Žádné kontakty
                </td>
              </tr>
            )}

            {customers.map((c) => (
              <tr
                key={c.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(c.id)}
              >
                <td className="py-2 px-3">{c.name}</td>
                <td className="py-2 px-3">{c.city ?? "-"}</td>
                <td className="py-2 px-3">{c.phone ?? "-"}</td>
                <td className="py-2 px-3 capitalize">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full border ${
        active ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}
