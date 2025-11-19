"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UnitStatus = "in_stock" | "sold" | "reserved" | "demo" | "scrapped";

type CustomerOption = {
  id: string;
  name: string;
  city: string | null;
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

export default function UnitDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [note, setNote] = useState("");
  const [status, setStatus] = useState<UnitStatus>("in_stock");
  const [salePrice, setSalePrice] = useState<string>("");
  const [saleDate, setSaleDate] = useState<string>("");

  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");

  const [customerId, setCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersError, setCustomersError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 1) detail jednotky
        const res = await fetch(`/api/units/${params.id}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(payload?.error ?? "Nepodařilo se načíst vozík.");
          return;
        }
        const data = await res.json();
        setUnit(data);
        setNote(data.note || "");
        setStatus(data.status || "in_stock");
        setSalePrice(
          data.sale_price != null ? String(data.sale_price) : ""
        );
        setSaleDate(data.sale_date || "");
        setPurchasePrice(
          data.purchase_price != null ? String(data.purchase_price) : ""
        );
        setPurchaseDate(data.purchase_date || "");
        setCustomerId(data.customer_id || "");

        // 2) načíst seznam zákazníků pro dropdown
        const resCustomers = await fetch("/api/customers");
        if (!resCustomers.ok) {
          const payload = await resCustomers.json().catch(() => null);
          setCustomersError(
            payload?.error ?? "Nepodařilo se načíst zákazníky."
          );
        } else {
          const list = (await resCustomers.json()) as any[];
          const options: CustomerOption[] = list.map((c) => ({
            id: c.id,
            name: c.name,
            city: c.city ?? null,
          }));
          setCustomers(options);
        }
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání vozíku.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!unit) return;

    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append("model", unit.model || "");
    formData.append("status", status);
    formData.append("note", note);
    formData.append("currency", unit.currency || "CZK");

    // prodejní informace
    if (salePrice) formData.append("sale_price", salePrice);
    if (saleDate) formData.append("sale_date", saleDate);

    // zákazník (může být prázdný)
    if (customerId) {
      formData.append("customer_id", customerId);
    } else {
      formData.append("customer_id", "");
    }

    // výrobní informace
    if (purchasePrice) formData.append("purchase_price", purchasePrice);
    if (purchaseDate) formData.append("purchase_date", purchaseDate);
    formData.append("purchase_currency", unit?.purchase_currency || "CZK");

    const res = await fetch(`/api/units/${unit.id}`, {
      method: "PATCH",
      body: formData,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Nepodařilo se uložit změny.");
      setSaving(false);
      return;
    }

    router.refresh();
    setSaving(false);
  }

  if (loading) {
    return <div className="p-4 text-gray-500">Načítám…</div>;
  }

  if (error || !unit) {
    return <div className="p-4 text-red-700">{error || "Chyba"}</div>;
  }

  const currentCustomerName =
    unit.customer?.name && unit.customer?.city
      ? `${unit.customer.name} (${unit.customer.city})`
      : unit.customer?.name || null;

  return (
    <main className="space-y-6 max-w-2xl">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {unit.serial_number}
          </h2>
          <p className="text-sm text-gray-500">
            {unit.model || "Neznámý model"} • {statusLabel(unit.status)}
          </p>
          {currentCustomerName && (
            <p className="text-sm text-gray-600">
              Zákazník:{" "}
              <span className="font-medium">{currentCustomerName}</span>
            </p>
          )}
        </div>

        <Link
          href="/units"
          className="text-sm text-gray-600 hover:underline"
        >
          Zpět na seznam
        </Link>
      </header>

      <section className="space-y-2">
        <h3 className="font-medium">Prodejní a výrobní informace</h3>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Stav + prodej */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Stav
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as UnitStatus)
                }
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="in_stock">Skladem</option>
                <option value="sold">Prodáno</option>
                <option value="reserved">Rezervace</option>
                <option value="demo">Demo</option>
                <option value="scrapped">Vyřazený</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Datum prodeje
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Prodejní cena (Kč)
              </label>
              <input
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Zákazník */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Zákazník
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="">– Nepřiřazen –</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.city ? ` (${c.city})` : ""}
                </option>
              ))}
            </select>
            {customersError && (
              <p className="text-xs text-red-600 mt-1">
                {customersError}
              </p>
            )}
          </div>

          {/* Výrobní cena + nákup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Výrobní / nákupní cena (Kč)
              </label>
              <input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Datum nákupu
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Poznámka */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Poznámka k vozíku
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Stav, úpravy, servis, atd."
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
            {saving ? "Ukládám…" : "Uložit změny"}
          </button>
        </form>
      </section>
    </main>
  );
}
