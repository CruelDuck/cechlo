"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("CZ");
  const [status, setStatus] = useState("nový");
  const [note, setNote] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");

  const [registrationNo, setRegistrationNo] = useState(""); // IČO
  const [vatNo, setVatNo] = useState("");                   // DIČ
  const [web, setWeb] = useState("");                       // Web

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    };

    const res = await fetch("/api/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Nepodařilo se vytvořit zákazníka.");
      return;
    }

    const created = await res.json();
    router.push(`/customers/${created.id}`);
    router.refresh();
  }

  return (
    <main className="space-y-6 max-w-2xl">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Nový kontakt / zákazník</h2>
        <Link
          href="/customers"
          className="text-xs text-gray-600 hover:underline"
        >
          Zpět na seznam
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {/* Základní info */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">
            Základní informace
          </h3>

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
              <label className="block text-xs font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Telefon
              </label>
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
              <label className="block text-xs font-medium mb-1">
                PSČ
              </label>
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Země
            </label>
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
              <label className="block text-xs font-medium mb-1">
                IČO
              </label>
              <input
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                DIČ
              </label>
              <input
                value={vatNo}
                onChange={(e) => setVatNo(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Web
              </label>
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
            {saving ? "Ukládám…" : "Vytvořit kontakt"}
          </button>

          <Link
            href="/customers"
            className="text-xs text-gray-600 hover:underline"
          >
            Zrušit
          </Link>
        </div>
      </form>
    </main>
  );
}
