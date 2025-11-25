// app/customers/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RoleFilter = "all" | "customer" | "supplier";

type Customer = {
  id: string;
  name: string;
  type: "person" | "company";
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  is_customer: boolean;
  is_supplier: boolean;
  status: string;
  next_action_at: string | null;
};

function roleLabel(c: Customer) {
  if (c.is_customer && c.is_supplier) return "Zákazník & dodavatel";
  if (c.is_customer) return "Zákazník";
  if (c.is_supplier) return "Dodavatel";
  return "Jiný";
}

function formatDate(d: string | null) {
  if (!d) return "–";
  return d;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");

  async function loadCustomers(opts?: { keepLoading?: boolean }) {
    if (!opts?.keepLoading) setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (role !== "all") params.set("role", role);
    if (search.trim()) params.set("q", search.trim());

    const url =
      "/api/customers" +
      (params.toString() ? `?${params.toString()}` : "");

    const res = await fetch(url);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Nepodařilo se načíst zákazníky.");
      setCustomers([]);
      setLoading(false);
      return;
    }

    const data = (await res.json()) as Customer[];
    setCustomers(data);
    setLoading(false);
  }

  useEffect(() => {
    // první načtení
    void loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // při změně role rovnou reload
  useEffect(() => {
    void loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    void loadCustomers();
  }

  return (
    <main className="space-y-6 max-w-5xl">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Kontakty</h2>
          <p className="text-sm text-gray-500">
            Zákazníci, dodavatelé a další kontakty.
          </p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center justify-center px-3 py-2 text-sm rounded-md bg-black text-white hover:bg-gray-800"
        >
          + Nový kontakt
        </Link>
      </header>

      {/* Filtry */}
      <section className="border rounded-lg bg-white p-3 sm:p-4 space-y-3">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row gap-3 sm:items-end"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">
              Hledat
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="jméno, firma, město, email, telefon…"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleFilter)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Všichni</option>
              <option value="customer">Jen zákazníci</option>
              <option value="supplier">Jen dodavatelé</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-gray-800"
          >
            Filtrovat
          </button>
        </form>
      </section>

      {/* Tabulka */}
      <section>
        {loading && (
          <p className="text-sm text-gray-500">
            Načítám kontakty…
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 mb-2">{error}</p>
        )}

        {!loading && !error && customers.length === 0 && (
          <p className="text-sm text-gray-500">
            Zatím žádné kontakty neodpovídají filtru.
          </p>
        )}

        {!loading && !error && customers.length > 0 && (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left">
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Jméno / firma
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Kontakt
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Telefon
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Email
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Město
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Role
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Stav
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Další akce
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      window.location.href = `/customers/${c.id}`;
                    }}
                  >
                    <td className="py-2 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {c.name}
                        </span>
                        {c.type === "company" && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            Firma
                            {c.contact_person && (
                              <>
                                · kontakt: {c.contact_person}
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {c.type === "person" && c.contact_person
                        ? c.contact_person
                        : "–"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {c.phone ?? "–"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.email}
                        </a>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {c.city ?? "–"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {roleLabel(c)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {c.status}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {formatDate(c.next_action_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
