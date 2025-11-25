// app/customers/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UnitStatus = "in_stock" | "sold" | "reserved" | "demo" | "scrapped";

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
};

type CustomerUnit = {
  id: string;
  serial_number: string;
  model: string | null;
  status: UnitStatus;
  sale_date: string | null;
  sale_price: number | null;
};

type ServiceEvent = {
  id: string;
  performed_at: string;
  title: string;
  description: string | null;
  type: string | null;
  labor_cost: number | null;
  material_cost: number | null;
  total_cost: number | null;
  currency: string;
  note: string | null;
  unit?: {
    id: string;
    serial_number: string;
    model: string | null;
  } | null;
};

function statusLabel(status: UnitStatus) {
  switch (status) {
    case "in_stock":
      return "Skladem";
    case "sold":
      return "Prodáno";
    case "reserved":
      return "Rezervace";
    case "demo":
      return "Demo";
    case "scrapped":
      return "Vyřazený";
    default:
      return status;
  }
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "-";
  return d;
}

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [units, setUnits] = useState<CustomerUnit[]>([]);
  const [serviceEvents, setServiceEvents] = useState<ServiceEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [serviceLoading, setServiceLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // stav pro nový servisní zásah
  const [newUnitId, setNewUnitId] = useState<string>("");
  const [newPerformedAt, setNewPerformedAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [newType, setNewType] = useState<string>("");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newLaborCost, setNewLaborCost] = useState<string>("");
  const [newMaterialCost, setNewMaterialCost] = useState<string>("");
  const [newTotalCost, setNewTotalCost] = useState<string>("");
  const [newCurrency, setNewCurrency] = useState<string>("CZK");
  const [newNote, setNewNote] = useState<string>("");
  const [savingService, setSavingService] = useState(false);

  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/customers/${params.id}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(payload?.error ?? "Nepodařilo se načíst zákazníka.");
          setCustomer(null);
          return;
        }

        const data = (await res.json()) as Customer;
        setCustomer(data);
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání zákazníka.");
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    }

    async function loadUnits() {
      try {
        setUnitsLoading(true);
        setUnitsError(null);

        const res = await fetch(`/api/customers/${params.id}/units`);
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setUnitsError(
            payload?.error ?? "Nepodařilo se načíst vozíky zákazníka."
          );
          setUnits([]);
          return;
        }

        const data = (await res.json()) as CustomerUnit[];
        setUnits(data);
      } catch (e) {
        console.error(e);
        setUnitsError("Neočekávaná chyba při načítání vozíků zákazníka.");
        setUnits([]);
      } finally {
        setUnitsLoading(false);
      }
    }

    async function loadServiceEvents() {
      try {
        setServiceLoading(true);
        setServiceError(null);

        const res = await fetch(
          `/api/customers/${params.id}/service-events`
        );
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setServiceError(
            payload?.error ?? "Nepodařilo se načíst servisní historii."
          );
          setServiceEvents([]);
          return;
        }

        const data = (await res.json()) as ServiceEvent[];
        setServiceEvents(data);
      } catch (e) {
        console.error(e);
        setServiceError(
          "Neočekávaná chyba při načítání servisní historie."
        );
        setServiceEvents([]);
      } finally {
        setServiceLoading(false);
      }
    }

    void loadCustomer();
    void loadUnits();
    void loadServiceEvents();
  }, [params.id]);

  async function handleCreateServiceEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;

    if (!newTitle.trim()) {
      setServiceError("Název zásahu je povinný.");
      return;
    }

    setSavingService(true);
    setServiceError(null);

    // pokud není vyplněno total_cost, můžeš ho automaticky dopočítat
    let totalToSend: string | null = newTotalCost || null;
    if (!totalToSend) {
      const labor = newLaborCost ? Number(newLaborCost) : 0;
      const material = newMaterialCost ? Number(newMaterialCost) : 0;
      const sum = labor + material;
      if (sum > 0) {
        totalToSend = String(sum);
      }
    }

    const body = {
      unit_id: newUnitId || null,
      performed_at: newPerformedAt || null,
      title: newTitle,
      description: newDescription || null,
      type: newType || null,
      labor_cost: newLaborCost || null,
      material_cost: newMaterialCost || null,
      total_cost: totalToSend,
      currency: newCurrency || "CZK",
      note: newNote || null,
    };

    const res = await fetch(`/api/customers/${customer.id}/service-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    setSavingService(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setServiceError(
        payload?.error ?? "Nepodařilo se uložit servisní zásah."
      );
      return;
    }

    const created = (await res.json()) as ServiceEvent;
    // přidáme nový záznam na začátek seznamu
    setServiceEvents((prev) => [created, ...prev]);

    // reset formuláře
    setNewUnitId("");
    setNewPerformedAt(new Date().toISOString().slice(0, 10));
    setNewType("");
    setNewTitle("");
    setNewDescription("");
    setNewLaborCost("");
    setNewMaterialCost("");
    setNewTotalCost("");
    setNewCurrency("CZK");
    setNewNote("");
  }

  async function handleDeleteServiceEvent(id: string) {
    if (!window.confirm("Opravdu smazat tento servisní záznam?")) return;

    const res = await fetch(`/api/service-events/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setServiceError(
        payload?.error ?? "Nepodařilo se smazat servisní zásah."
      );
      return;
    }

    setServiceEvents((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading && !customer) {
    return (
      <main className="max-w-3xl">
        <p className="text-sm text-gray-500">Načítám zákazníka…</p>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="max-w-3xl">
        <p className="text-sm text-red-600">
          Zákazník nebyl nalezen nebo došlo k chybě.
        </p>
        {error && (
          <p className="text-sm text-red-600 mt-2">Detail: {error}</p>
        )}
        <Link
          href="/customers"
          className="text-sm text-gray-600 hover:underline mt-4 inline-block"
        >
          Zpět na seznam kontaktů
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-8 max-w-4xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{customer.name}</h2>
          {customer.company && (
            <p className="text-sm text-gray-600">{customer.company}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {customer.street && (
              <>
                {customer.street}
                {", "}
              </>
            )}
            {customer.zip && `${customer.zip} `}
            {customer.city}
            {customer.country && `, ${customer.country}`}
          </p>
          {customer.email && (
            <p className="text-sm text-gray-600 mt-1">
              Email:{" "}
              <a
                href={`mailto:${customer.email}`}
                className="text-blue-600 hover:underline"
              >
                {customer.email}
              </a>
            </p>
          )}
          {customer.phone && (
            <p className="text-sm text-gray-600">
              Telefon:{" "}
              <a
                href={`tel:${customer.phone}`}
                className="text-blue-600 hover:underline"
              >
                {customer.phone}
              </a>
            </p>
          )}
          {customer.next_action_at && (
            <p className="text-xs text-gray-500 mt-1">
              Další akce: {customer.next_action_at}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="text-sm text-blue-600 hover:underline"
          >
            Upravit kontakt
          </Link>
          <Link
            href="/customers"
            className="text-xs text-gray-600 hover:underline"
          >
            Zpět na seznam
          </Link>
        </div>
      </header>

      {/* Poznámka k zákazníkovi */}
      {customer.note && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">
            Poznámka k zákazníkovi
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {customer.note}
          </p>
        </section>
      )}

      {/* Vozíky zákazníka */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            Vozíky u tohoto zákazníka
          </h3>
        </div>

        {unitsLoading && (
          <p className="text-sm text-gray-500">
            Načítám vozíky zákazníka…
          </p>
        )}

        {unitsError && (
          <p className="text-sm text-red-600">{unitsError}</p>
        )}

        {!unitsLoading && !unitsError && units.length === 0 && (
          <p className="text-sm text-gray-500">
            Tento zákazník zatím nemá přiřazený žádný vozík.
          </p>
        )}

        {!unitsLoading && !unitsError && units.length > 0 && (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left">
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Sériové číslo
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Model
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Stav
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Datum prodeje
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Prodejní cena
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {units.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/units/${u.id}`)}
                  >
                    <td className="py-2 px-3 font-mono whitespace-nowrap">
                      {u.serial_number}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {u.model ?? "–"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {statusLabel(u.status)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {formatDate(u.sale_date)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right">
                      {u.sale_price != null
                        ? `${u.sale_price} Kč`
                        : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Servisní historie */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Servisní historie
        </h3>

        {serviceLoading && (
          <p className="text-sm text-gray-500">
            Načítám servisní záznamy…
          </p>
        )}

        {serviceError && (
          <p className="text-sm text-red-600">{serviceError}</p>
        )}

        {!serviceLoading && !serviceError && serviceEvents.length === 0 && (
          <p className="text-sm text-gray-500">
            Zatím žádné servisní záznamy.
          </p>
        )}

        {!serviceLoading && !serviceError && serviceEvents.length > 0 && (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left">
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Datum
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Vozík
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Typ
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Název
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Cena celkem
                  </th>
                  <th className="py-2 px-3 font-medium text-gray-700">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {serviceEvents.map((s) => (
                  <tr key={s.id} className="align-top">
                    <td className="py-2 px-3 whitespace-nowrap">
                      {formatDate(s.performed_at)}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {s.unit
                        ? `${s.unit.model ?? ""} ${
                            s.unit.serial_number ?? ""
                          }`
                        : "–"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {s.type ?? "–"}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium">{s.title}</div>
                      {s.description && (
                        <div className="text-xs text-gray-600">
                          {s.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right">
                      {s.total_cost != null
                        ? `${s.total_cost} ${s.currency}`
                        : "–"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteServiceEvent(s.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Smazat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Formulář pro nový servisní zásah */}
        <div className="border rounded-lg p-4 bg-white space-y-3">
          <h4 className="text-sm font-semibold text-gray-800">
            Přidat servisní zásah
          </h4>

          <form
            onSubmit={handleCreateServiceEvent}
            className="space-y-3 text-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={newPerformedAt}
                  onChange={(e) => setNewPerformedAt(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Vozík (volitelné)
                </label>
                <select
                  value={newUnitId}
                  onChange={(e) => setNewUnitId(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                >
                  <option value="">– bez vazby –</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.model ?? ""} {u.serial_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Typ
                </label>
                <input
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="např. servis, reklamace, údržba"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Název / stručný popis
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border rounded-md px-2 py-1 text-sm"
                placeholder="např. výměna ložisek zadní nápravy"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Detailní popis (volitelné)
              </label>
              <textarea
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full border rounded-md px-2 py-1 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Cena práce
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newLaborCost}
                  onChange={(e) => setNewLaborCost(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Cena materiálu
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newMaterialCost}
                  onChange={(e) => setNewMaterialCost(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Cena celkem
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newTotalCost}
                  onChange={(e) => setNewTotalCost(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="pokud necháš prázdné, dopočte se práce+materiál"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Měna
                </label>
                <input
                  type="text"
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Interní poznámka (volitelné)
              </label>
              <textarea
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full border rounded-md px-2 py-1 text-sm"
              />
            </div>

            {serviceError && (
              <div className="text-xs text-red-700 border border-red-200 bg-red-50 px-3 py-2 rounded-md">
                {serviceError}
              </div>
            )}

            <button
              type="submit"
              disabled={savingService}
              className="px-4 py-2 bg-black text-white rounded-md text-xs sm:text-sm disabled:opacity-50"
            >
              {savingService
                ? "Ukládám servisní záznam…"
                : "Přidat servisní záznam"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
