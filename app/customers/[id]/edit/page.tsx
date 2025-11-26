"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CustomerType = "person" | "company";

type Customer = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  status: string;
  note: string | null;
  next_action_at: string | null;
  registration_no: string | null;
  vat_no: string | null;
  web: string | null;
  type: CustomerType; // 👈 přidané
};

export default function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // formulářové hodnoty
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");

  const [registrationNo, setRegistrationNo] = useState(""); // IČO
  const [vatNo, setVatNo] = useState(""); // DIČ
  const [web, setWeb] = useState(""); // web

  const [customerType, setCustomerType] = useState<CustomerType>("person"); // 👈 osoba/firma

  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/customers/${params.id}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(payload?.error ?? "Nepodařilo se načíst zákazníka.");
          return;
        }

        const data = (await res.json()) as Customer;

        setName(data.name ?? "");
        setCompany(data.company ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setStreet(data.street ?? "");
        setCity(data.city ?? "");
        setZip(data.zip ?? "");
        setCountry(data.country ?? "");
        setStatus(data.status ?? "");
        setNote(data.note ?? "");
        setNextActionAt(
          data.next_action_at ? data.next_action_at.slice(0, 10) : ""
        );
        setRegistrationNo(data.registration_no ?? "");
        setVatNo(data.vat_no ?? "");
        setWeb(data.web ?? "");
        setCustomerType(data.type ?? "person"); // 👈 načtení typu
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání zákazníka.");
      } finally {
        setLoading(false);
      }
    }

    void loadCustomer();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Jméno / název zákazníka je povinné.");
      return;
    }

    setSaving(true);

    const body = {
      name: name.trim(),
      company: company.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      street: street.trim() || null,
      city: city.trim() || null,
      zip: zip.trim() || null,
      country: country.trim() || null,
      status: status.trim() || "nový",
      note: note.trim() || null,
      next_action_at: nextActionAt || null,
      registration_no: registrationNo.trim() || null,
      vat_no: vatNo.trim() || null,
      web: web.trim() || null,
      type: customerType, // 👈 pošleme na API
    };

    const res = await fetch(`/api/customers/${params.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Nepodařilo se uložit změny kontaktu.");
      return;
    }

    router.push(`/customers/${params.id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <main className="max-w-2xl">
        <p className="text-sm text-gray-500">Načítám kontakt…</p>
      </main>
    );
  }

  return (
    <main className="space-y-6 max-w-2xl">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Upravit kontakt</h2>
        <Link
          href={`/customers/${params.id}`}
          className="text-xs text-gray-600 hover:underline"
        >
          Zpět na detail
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {/* Základní info */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">
            Základní informace
          </h3>

          {/* typ kontaktu osoba/firma */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Typ kontaktu
            </label>
            <div className="flex items-center gap-4 text-xs">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="customerType"
                  value="person"
                  checked={customerType === "person"}
                  onChange={() => setCustomerType("person")}
                />
                <span>Osoba</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="customerType"
                  value="company"
                  checked={customerType === "company"}
                  onChange={() => setCustomerType("company")}
                />
                <span>Firma</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Jméno / název *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Firma (pokud je jiná než jméno)
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="např. Biobobo s.r.o."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Telefon</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Adresa */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">Adresa</h3>

          <div>
            <label className="block text-xs font-medium mb-1">
              Ulice a číslo
            </label>
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="např. Českolipská 393/6"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">
                Město / obec
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">PSČ</label>
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Země</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="např. CZ / Česká republika"
            />
          </div>
        </div>

        {/* IČO / DIČ / web */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">
            Firemní údaje
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">IČO</label>
              <input
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">DIČ</label>
              <input
                value={vatNo}
                onChange={(e) => setVatNo(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Web</label>
              <input
                value={web}
                onChange={(e) => setWeb(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="např. https://firma.cz"
              />
            </div>
          </div>
        </div>

        {/* Stav & další akce */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">
            Stav a další akce
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Stav (interní)
              </label>
              <input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="např. nový lead, zákazník, neaktivní…"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Další akce (datum)
              </label>
              <input
                type="date"
                value={nextActionAt}
                onChange={(e) => setNextActionAt(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Poznámka */}
        <div>
          <label className="block text-xs font-medium mb-1">
            Interní poznámka
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="text-xs text-red-700 border border-red-200 bg-red-50 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-black text-white rounded-md text-sm disabled:opacity-50"
          >
            {saving ? "Ukládám…" : "Uložit změny"}
          </button>

          <Link
            href={`/customers/${params.id}`}
            className="text-xs text-gray-600 hover:underline"
          >
            Zrušit
          </Link>
        </div>
      </form>
    </main>
  );
}
