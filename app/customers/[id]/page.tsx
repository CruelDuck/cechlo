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
  registration_no: string | null; // IČO
  vat_no: string | null;           // DIČ
  web: string | null;              // web
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
  vat_rate: number | null;
  unit?: {
    id: string;
    serial_number: string;
    model: string | null;
  } | null;
};

type PartOption = {
  id: string;
  part_number: string;
  name: string;
  sale_price: number | null;
  drawing_position: number | null;
  vat_rate: number | null;
};

type PartPurchase = {
  id: string;
  purchased_at: string;
  quantity: number;
  unit_price: number;
  currency: string;
  note: string | null;
  service_event_id?: string | null;
  vat_rate?: number | null;
  part?: {
    id: string;
    part_number: string;
    name: string;
    category?: string | null;
    drawing_position?: number | null;
    vat_rate?: number | null;
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
  const [partPurchases, setPartPurchases] = useState<PartPurchase[]>([]);
  const [parts, setParts] = useState<PartOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [partsLoading, setPartsLoading] = useState(true);
  const [partsPurchasesLoading, setPartsPurchasesLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [partsError, setPartsError] = useState<string | null>(null);
  const [partsPurchasesError, setPartsPurchasesError] = useState<
    string | null
  >(null);

  // nový servisní zásah
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
  const [newVatRate, setNewVatRate] = useState<string>("21");
  const [newCurrency, setNewCurrency] = useState<string>("CZK");
  const [newNote, setNewNote] = useState<string>("");;
  const [savingService, setSavingService] = useState(false);

  // nový nákup ND
  const [newPartId, setNewPartId] = useState<string>("");
  const [newPurchasedAt, setNewPurchasedAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [newQuantity, setNewQuantity] = useState<string>("1");
  const [newUnitPrice, setNewUnitPrice] = useState<string>("");
  const [newPartCurrency, setNewPartCurrency] = useState<string>("CZK");
  const [newPartNote, setNewPartNote] = useState<string>("");
  const [newPartServiceEventId, setNewPartServiceEventId] =
    useState<string>("");
  const [newPartVatRate, setNewPartVatRate] = useState<string>("21");
  const [savingPartPurchase, setSavingPartPurchase] = useState(false);

  // editace nákupu ND
  const [editingPartPurchaseId, setEditingPartPurchaseId] =
    useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>("");
  const [editUnitPrice, setEditUnitPrice] = useState<string>("");
  const [editCurrency, setEditCurrency] = useState<string>("CZK");
  const [editNote, setEditNote] = useState<string>("");
  const [editVatRate, setEditVatRate] = useState<string>("21");

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

    async function loadParts() {
      try {
        setPartsLoading(true);
        setPartsError(null);

        const res = await fetch("/api/parts");
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setPartsError(
            payload?.error ?? "Nepodařilo se načíst seznam náhradních dílů."
          );
          setParts([]);
          return;
        }

        const data = (await res.json()) as any[];
        const options: PartOption[] = data.map((p) => ({
          id: p.id,
          part_number: p.part_number,
          name: p.name,
          sale_price: p.sale_price ?? null,
          drawing_position: p.drawing_position ?? null,
          vat_rate: p.vat_rate ?? null,
        }));
        setParts(options);
      } catch (e) {
        console.error(e);
        setPartsError(
          "Neočekávaná chyba při načítání seznamu náhradních dílů."
        );
        setParts([]);
      } finally {
        setPartsLoading(false);
      }
    }

    async function loadPartPurchases() {
      try {
        setPartsPurchasesLoading(true);
        setPartsPurchasesError(null);

        const res = await fetch(
          `/api/customers/${params.id}/part-purchases`
        );
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setPartsPurchasesError(
            payload?.error ??
              "Nepodařilo se načíst nákupy náhradních dílů."
          );
          setPartPurchases([]);
          return;
        }

        const data = (await res.json()) as PartPurchase[];
        setPartPurchases(data);
      } catch (e) {
        console.error(e);
        setPartsPurchasesError(
          "Neočekávaná chyba při načítání nákupů náhradních dílů."
        );
        setPartPurchases([]);
      } finally {
        setPartsPurchasesLoading(false);
      }
    }

    void loadCustomer();
    void loadUnits();
    void loadServiceEvents();
    void loadParts();
    void loadPartPurchases();
  }, [params.id]);

  // --- Servisní zásahy ---

  async function handleCreateServiceEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;

    if (!newTitle.trim()) {
      setServiceError("Název zásahu je povinný.");
      return;
    }

    setSavingService(true);
    setServiceError(null);

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
          vat_rate: newVatRate || "21",
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
    setServiceEvents((prev) => [created, ...prev]);

    setNewUnitId("");
    setNewPerformedAt(new Date().toISOString().slice(0, 10));
    setNewType("");
    setNewTitle("");
    setNewDescription("");
    setNewLaborCost("");
    setNewMaterialCost("");
    setNewTotalCost("");
    setNewVatRate("21");
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
    setPartPurchases((prev) =>
      prev.map((p) =>
        p.service_event_id === id ? { ...p, service_event_id: null } : p
      )
    );
  }

  function handleAddPartForServiceEvent(s: ServiceEvent) {
    setNewPartServiceEventId(s.id);
    if (s.performed_at) {
      setNewPurchasedAt(s.performed_at);
    }
    if (typeof document !== "undefined") {
      const el = document.getElementById("add-part-purchase-form");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  // --- Nákupy ND ---

  function handleNewPartChange(partId: string) {
    setNewPartId(partId);
    const found = parts.find((p) => p.id === partId);
    if (found) {
      if (found.sale_price != null) {
        setNewUnitPrice(String(found.sale_price));
      }
      if (found.vat_rate != null) {
        setNewPartVatRate(String(found.vat_rate));
      } else {
        setNewPartVatRate("21");
      }
    }
  }

  async function handleCreatePartPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;

    if (!newPartId) {
      setPartsPurchasesError("Vyber náhradní díl.");
      return;
    }

    if (!newUnitPrice) {
      setPartsPurchasesError("Zadej prodejní cenu dílu.");
      return;
    }

    const qty = newQuantity ? Number(newQuantity) : 1;
    if (Number.isNaN(qty) || qty <= 0) {
      setPartsPurchasesError("Množství musí být kladné číslo.");
      return;
    }

    setSavingPartPurchase(true);
    setPartsPurchasesError(null);

    const body = {
      part_id: newPartId,
      purchased_at: newPurchasedAt || null,
      quantity: newQuantity,
      unit_price: newUnitPrice,
      currency: newPartCurrency || "CZK",
      note: newPartNote || null,
      service_event_id: newPartServiceEventId || null,
      vat_rate: newPartVatRate || "21",
    };

    const res = await fetch(
      `/api/customers/${customer.id}/part-purchases`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    setSavingPartPurchase(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setPartsPurchasesError(
        payload?.error ?? "Nepodařilo se uložit nákup náhradního dílu."
      );
      return;
    }

    const created = (await res.json()) as PartPurchase;
    setPartPurchases((prev) => [created, ...prev]);

    setNewPartId("");
    setNewPurchasedAt(new Date().toISOString().slice(0, 10));
    setNewQuantity("1");
    setNewUnitPrice("");
    setNewPartCurrency("CZK");
    setNewPartNote("");
    setNewPartServiceEventId("");
    setNewPartVatRate("21");
  }

  function startEditPartPurchase(p: PartPurchase) {
    setEditingPartPurchaseId(p.id);
    setEditQuantity(String(p.quantity ?? 1));
    setEditUnitPrice(String(p.unit_price ?? ""));
    setEditCurrency(p.currency || "CZK");
    setEditNote(p.note ?? "");
    setEditVatRate(String(p.vat_rate ?? 21));
    setPartsPurchasesError(null);
  }

  function cancelEditPartPurchase() {
    setEditingPartPurchaseId(null);
    setEditQuantity("");
    setEditUnitPrice("");
    setEditCurrency("CZK");
    setEditNote("");
    setEditVatRate("21");
  }

  async function saveEditPartPurchase(id: string) {
    const qty = editQuantity ? Number(editQuantity) : 1;
    if (Number.isNaN(qty) || qty <= 0) {
      setPartsPurchasesError("Množství musí být kladné číslo.");
      return;
    }

    if (!editUnitPrice) {
      setPartsPurchasesError("Cena musí být vyplněná.");
      return;
    }

    const body = {
      quantity: editQuantity,
      unit_price: editUnitPrice,
      currency: editCurrency || "CZK",
      note: editNote || null,
      vat_rate: editVatRate || "21",
    };

    const res = await fetch(`/api/part-purchases/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setPartsPurchasesError(
        payload?.error ?? "Nepodařilo se upravit nákup náhradního dílu."
      );
      return;
    }

    const updated = (await res.json()) as PartPurchase;

    setPartPurchases((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );

    cancelEditPartPurchase();
  }

  async function handleDeletePartPurchase(id: string) {
    if (
      !window.confirm("Opravdu smazat tento nákup náhradního dílu?")
    )
      return;

    const res = await fetch(`/api/part-purchases/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setPartsPurchasesError(
        payload?.error ?? "Nepodařilo se smazat nákup náhradního dílu."
      );
      return;
    }

    setPartPurchases((prev) => prev.filter((p) => p.id !== id));
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
      {/* HLAVIČKA */}
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
                  {(customer.registration_no || customer.vat_no || customer.web) && (
      <div className="mt-2 space-y-1 text-xs text-gray-600">
        {customer.registration_no && (
          <p>IČO: {customer.registration_no}</p>
        )}
        {customer.vat_no && <p>DIČ: {customer.vat_no}</p>}
        {customer.web && (
          <p>
            Web:{" "}
            <a
              href={
                customer.web.startsWith("http")
                  ? customer.web
                  : `https://${customer.web}`
              }
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              {customer.web}
            </a>
          </p>
        )}
      </div>
    )}
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
                    Díly
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
                {serviceEvents.map((s) => {
                  const eventParts = partPurchases.filter(
                    (p) => p.service_event_id === s.id
                  );

                  return (
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
                      <td className="py-2 px-3">
                        {eventParts.length === 0 ? (
                          <span className="text-xs text-gray-400">–</span>
                        ) : (
                          <ul className="space-y-1">
                            {eventParts.map((p) => {
                              const vat = p.vat_rate ?? 21;
                              const priceWithVat = Math.round(
                                p.unit_price * (1 + vat / 100)
                              );
                              return (
                                <li
                                  key={p.id}
                                  className="text-xs text-gray-700"
                                >
                                  {p.part ? (
                                    <>
                                      <span className="font-medium">
                                        {p.part.name}
                                      </span>
                                      {typeof p.part.drawing_position ===
                                        "number" && (
                                        <span className="text-gray-500">
                                          {" "}
                                          (poz. {p.part.drawing_position})
                                        </span>
                                      )}
                                      <span className="text-gray-500">
                                        {" "}
                                        – {p.quantity} ks,{" "}
                                        {p.unit_price} {p.currency} bez
                                        DPH / {priceWithVat} {p.currency} s
                                        DPH ({vat}%)
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      Díl – {p.quantity} ks, {p.unit_price}{" "}
                                      {p.currency}
                                    </>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </td>
<td className="py-2 px-3 whitespace-nowrap text-right">
  {s.total_cost != null ? (
    <div className="text-xs">
      {(() => {
        const vat = s.vat_rate ?? 21;
        const totalNet = s.total_cost!;
        const totalGross = Math.round(totalNet * (1 + vat / 100));

        return (
          <>
            <div>
              {totalNet} {s.currency} bez DPH
            </div>
            <div className="text-gray-500">
              {totalGross} {s.currency} s DPH ({vat}%)
            </div>
          </>
        );
      })()}
    </div>
  ) : (
    "–"
  )}
</td>
                      <td className="py-2 px-3 whitespace-nowrap text-right">
                        <div className="flex flex-col gap-1 items-end">
                          <button
                            type="button"
                            onClick={() => handleAddPartForServiceEvent(s)}
                            className="text-xs text-blue-700 hover:underline"
                          >
                            Přidat díl
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteServiceEvent(s.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Smazat
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

   <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
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
                  DPH (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newVatRate}
                  onChange={(e) => setNewVatRate(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
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

      {/* Nákupy náhradních dílů */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">
          Nákupy náhradních dílů
        </h3>

        {partsPurchasesLoading && (
          <p className="text-sm text-gray-500">
            Načítám nákupy náhradních dílů…
          </p>
        )}

        {partsPurchasesError && (
          <p className="text-sm text-red-600">
            {partsPurchasesError}
          </p>
        )}

        {!partsPurchasesLoading &&
          !partsPurchasesError &&
          partPurchases.length === 0 && (
            <p className="text-sm text-gray-500">
              Zatím žádné nákupy náhradních dílů.
            </p>
          )}

        {!partsPurchasesLoading &&
          !partsPurchasesError &&
          partPurchases.length > 0 && (
            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left">
                    <th className="py-2 px-3 font-medium text-gray-700">
                      Datum
                    </th>
                    <th className="py-2 px-3 font-medium text-gray-700">
                      Díl
                    </th>
                    <th className="py-2 px-3 font-medium text-gray-700">
                      Pozice
                    </th>
                    <th className="py-2 px-3 font-medium text-gray-700">
                      Množství
                    </th>
                    <th className="py-2 px-3 font-medium text-gray-700">
                      Cena za ks
                    </th>
                    <th className="py-2 px-3 font-medium text-gray-700">
                      Cena celkem
                    </th>
                    <th className="py-2 px-3 font-medium text-gray-700">
                      Poznámka
                    </th>
                    <th className="py-2 px-3 font-medium text-gray-700">
                      Akce
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {partPurchases.map((p) => {
                    const totalNet = p.quantity * p.unit_price;
                    const vat = p.vat_rate ?? 21;
                    const priceWithVat = Math.round(
                      p.unit_price * (1 + vat / 100)
                    );
                    const totalWithVat = Math.round(
                      totalNet * (1 + vat / 100)
                    );
                    const isEditing = editingPartPurchaseId === p.id;

                    return (
                      <tr key={p.id} className="align-top">
                        <td className="py-2 px-3 whitespace-nowrap">
                          {formatDate(p.purchased_at)}
                        </td>
                        <td className="py-2 px-3">
                          {p.part ? (
                            <>
                              <div className="font-medium">
                                {p.part.name}
                                {typeof p.part.drawing_position ===
                                  "number" && (
                                  <span className="text-gray-500">
                                    {" "}
                                    (poz. {p.part.drawing_position})
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {p.part.part_number}
                              </div>
                            </>
                          ) : (
                            "–"
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {p.part &&
                          typeof p.part.drawing_position === "number"
                            ? p.part.drawing_position
                            : "–"}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editQuantity}
                              onChange={(e) =>
                                setEditQuantity(e.target.value)
                              }
                              className="border rounded-md px-2 py-1 text-xs w-20"
                            />
                          ) : (
                            p.quantity
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {isEditing ? (
                            <>
                              <input
                                type="number"
                                step="0.01"
                                value={editUnitPrice}
                                onChange={(e) =>
                                  setEditUnitPrice(e.target.value)
                                }
                                className="border rounded-md px-2 py-1 text-xs w-24 mb-1"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">
                                  DPH
                                </span>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={editVatRate}
                                  onChange={(e) =>
                                    setEditVatRate(e.target.value)
                                  }
                                  className="border rounded-md px-2 py-1 text-xs w-16"
                                />
                                <span className="text-xs text-gray-500">
                                  %
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="text-xs">
                              <div>
                                {p.unit_price} {p.currency} bez DPH
                              </div>
                              <div className="text-gray-500">
                                {priceWithVat} {p.currency} s DPH ({vat}
                                %)
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-right">
                          <div className="text-xs">
                            <div>
                              {totalNet} {p.currency} bez DPH
                            </div>
                            <div className="text-gray-500">
                              {totalWithVat} {p.currency} s DPH
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          {isEditing ? (
                            <textarea
                              rows={2}
                              value={editNote}
                              onChange={(e) =>
                                setEditNote(e.target.value)
                              }
                              className="border rounded-md px-2 py-1 text-xs w-full"
                            />
                          ) : (
                            <span className="text-xs text-gray-700 whitespace-pre-wrap">
                              {p.note ?? "–"}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-right">
                          {isEditing ? (
                            <div className="flex flex-col gap-1 items-end">
                              <button
                                type="button"
                                onClick={() =>
                                  saveEditPartPurchase(p.id)
                                }
                                className="text-xs text-green-700 hover:underline"
                              >
                                Uložit
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditPartPurchase}
                                className="text-xs text-gray-600 hover:underline"
                              >
                                Zrušit
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 items-end">
                              <button
                                type="button"
                                onClick={() => startEditPartPurchase(p)}
                                className="text-xs text-blue-700 hover:underline"
                              >
                                Upravit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeletePartPurchase(p.id)
                                }
                                className="text-xs text-red-600 hover:underline"
                              >
                                Smazat
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        {/* Formulář pro nový nákup ND */}
        <div
          id="add-part-purchase-form"
          className="border rounded-lg p-4 bg-white space-y-3"
        >
          <h4 className="text-sm font-semibold text-gray-800">
            Přidat nákup náhradního dílu
          </h4>

          {partsLoading && (
            <p className="text-xs text-gray-500">
              Načítám seznam dílů…
            </p>
          )}
          {partsError && (
            <p className="text-xs text-red-600">{partsError}</p>
          )}

          <form
            onSubmit={handleCreatePartPurchase}
            className="space-y-3 text-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Datum nákupu
                </label>
                <input
                  type="date"
                  value={newPurchasedAt}
                  onChange={(e) => setNewPurchasedAt(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">
                  Náhradní díl
                </label>
                <select
                  value={newPartId}
                  onChange={(e) => handleNewPartChange(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  disabled={partsLoading || !!partsError}
                >
                  <option value="">– vyber díl –</option>
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.drawing_position != null
                        ? `[poz. ${p.drawing_position}] `
                        : ""}
                      {p.part_number} – {p.name}
                      {p.sale_price != null
                        ? ` (doporučená: ${p.sale_price} Kč)`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Množství
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Cena za ks (bez DPH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  placeholder="např. 950"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  DPH (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newPartVatRate}
                  onChange={(e) => setNewPartVatRate(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Měna
                </label>
                <input
                  type="text"
                  value={newPartCurrency}
                  onChange={(e) => setNewPartCurrency(e.target.value)}
                  className="w-full border rounded-md px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Servisní zásah (volitelné)
                </label>
                <select
                  value={newPartServiceEventId}
                  onChange={(e) =>
                    setNewPartServiceEventId(e.target.value)
                  }
                  className="w-full border rounded-md px-2 py-1 text-sm"
                >
                  <option value="">– nepřiřazovat –</option>
                  {serviceEvents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatDate(s.performed_at)} – {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Poznámka (volitelné)
              </label>
              <textarea
                rows={2}
                value={newPartNote}
                onChange={(e) => setNewPartNote(e.target.value)}
                className="w-full border rounded-md px-2 py-1 text-sm"
              />
            </div>

            {partsPurchasesError && (
              <div className="text-xs text-red-700 border border-red-200 bg-red-50 px-3 py-2 rounded-md">
                {partsPurchasesError}
              </div>
            )}

            <button
              type="submit"
              disabled={savingPartPurchase || partsLoading || !!partsError}
              className="px-4 py-2 bg-black text-white rounded-md text-xs sm:text-sm disabled:opacity-50"
            >
              {savingPartPurchase
                ? "Ukládám nákup dílu…"
                : "Přidat nákup dílu"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
