// app/customers/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CustomerType = "person" | "company";

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<CustomerType>("person");
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  const [email, setEmail] = useState("");
  const [emailSecondary, setEmailSecondary] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("Česko");

  const [ico, setIco] = useState("");
  const [dic, setDic] = useState("");
  const [paymentDueDays, setPaymentDueDays] = useState("");

  const [isCustomer, setIsCustomer] = useState(true);
  const [isSupplier, setIsSupplier] = useState(false);

  const [status, setStatus] = useState("active");
  const [note, setNote] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const body = {
      type,
      name,
      contact_person: contactPerson,
      email,
      email_secondary: emailSecondary,
      phone,
      website,
      street,
      city,
      zip,
      country,
      ico,
      dic,
      payment_due_days: paymentDueDays,
      is_customer: isCustomer,
      is_supplier: isSupplier,
      status,
      note,
      next_action_at: nextActionAt,
    };

    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Nepodařilo se uložit kontakt.");
      return;
    }

    const created = await res.json();
    router.push(`/customers/${created.id}`);
    router.refresh();
  }

  return (
    <main className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold">Nový kontakt</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* typ + jméno */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              Typ
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CustomerType)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="person">Osoba</option>
              <option value="company">Firma</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1">
              Jméno / název
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder={
                type === "company" ? "Biobobo s.r.o." : "Jan Novák"
              }
            />
          </div>
        </div>

        {/* kontakt osoba */}
        {type === "company" && (
          <div>
            <label className="block text-xs font-medium mb-1">
              Kontaktní osoba (volitelné)
            </label>
            <input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="např. Martin Podlesný"
            />
          </div>
        )}

        {/* email / telefon / web */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              Další email (volitelné)
            </label>
            <input
              type="email"
              value={emailSecondary}
              onChange={(e) => setEmailSecondary(e.target.value)}
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

        <div>
          <label className="block text-xs font-medium mb-1">
            Web (volitelné)
          </label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="https://…"
          />
        </div>

        {/* adresa */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-700">
            Adresa
          </h3>
          <div>
            <label className="block text-xs font-medium mb-1">
              Ulice a č.p.
            </label>
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">
                Město
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
            />
          </div>
        </div>

        {/* firemní údaje */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-700">
            Firemní údaje (pokud dává smysl)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                IČO
              </label>
              <input
                value={ico}
                onChange={(e) => setIco(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                DIČ
              </label>
              <input
                value={dic}
                onChange={(e) => setDic(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Splatnost (dny)
              </label>
              <input
                type="number"
                value={paymentDueDays}
                onChange={(e) => setPaymentDueDays(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* role & stav */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-700">
            Role & stav
          </h3>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={isCustomer}
                onChange={(e) => setIsCustomer(e.target.checked)}
              />
              <span>Je zákazník</span>
            </label>
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={isSupplier}
                onChange={(e) => setIsSupplier(e.target.checked)}
              />
              <span>Je dodavatel</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Stav (např. lead, aktivní…)
              </label>
              <input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Další akce kdy (volitelné)
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

        {/* poznámka */}
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

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-black text-white rounded-md text-sm disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit kontakt"}
        </button>
      </form>
    </main>
  );
}
