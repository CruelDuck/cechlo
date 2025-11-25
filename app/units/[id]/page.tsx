"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UnitStatus = "in_stock" | "sold" | "reserved" | "demo" | "scrapped";
type UnitPrepStatus = "neslozeno" | "slozeno" | "pripraveno" | "odeslano";

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

function normalizePrepStatus(value: any): UnitPrepStatus {
  if (value == null) return "neslozeno";
  const v = String(value).toLowerCase().trim();

  if (v === "neslozeno" || v === "nesloženo") return "neslozeno";
  if (v === "slozeno" || v === "složeno") return "slozeno";
  if (
    v === "pripraveno" ||
    v === "pripravene" ||
    v === "připraveno" ||
    v.includes("pripraveno k odeslani") ||
    v.includes("připraveno k odeslání")
  ) {
    return "pripraveno";
  }
  if (v === "odeslano" || v === "odesláno") return "odeslano";

  return "neslozeno";
}

function prepStatusLabel(prep: UnitPrepStatus) {
  switch (prep) {
    case "neslozeno":
      return "Nesloženo";
    case "slozeno":
      return "Složeno";
    case "pripraveno":
      return "Připraveno k odeslání";
    case "odeslano":
      return "Odesláno";
    default:
      return "-";
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
  const [prepStatus, setPrepStatus] = useState<UnitPrepStatus>("neslozeno");
  const [salePrice, setSalePrice] = useState<string>("");
  const [saleDate, setSaleDate] = useState<string>("");

  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");

  const [customerId, setCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersError, setCustomersError] = useState<string | null>(null);

  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

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
          setUnit(null);
        } else {
          const data = await res.json();
          setUnit(data);
          setNote(data.note || "");
          setStatus((data.status as UnitStatus) || "in_stock");
          setPrepStatus(normalizePrepStatus(data.prep_status));
          setSalePrice(
            data.sale_price != null ? String(data.sale_price) : ""
          );
          setSaleDate(data.sale_date || "");
          setPurchasePrice(
            data.purchase_price != null ? String(data.purchase_price) : ""
          );
          setPurchaseDate(data.purchase_date || "");
          setCustomerId(data.customer_id || "");
        }

        // 2) seznam zákazníků
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
        setUnit(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!unit) return;

    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append("model", unit.model || "");
    formData.append("status", status);
    formData.append("prep_status", prepStatus); // uložíme kanonickou hodnotu
    formData.append("note", note);
    formData.append("currency", unit.currency || "CZK");

    // prodejní informace
    if (salePrice) formData.append("sale_price", salePrice);
    if (saleDate) formData.append("sale_date", saleDate);

    if (customerId) {
      formData.append("customer_id", customerId);
    } else {
      formData.append("customer_id", "");
    }

    // výrobní informace
    if (purchasePrice) formData.append("purchase_price", purchasePrice);
    if (purchaseDate) formData.append("purchase_date", purchaseDate);
    formData.append(
      "purchase_currency",
      unit?.purchase_currency || "CZK"
    );

    const res = await fetch(`/api/units/${unit.id}`, {
      method: "PATCH",
      body: formData,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Nepodařilo se uložit změny.");
    } else {
      router.refresh();
    }

    setSaving(false);
  }

  async function handleInvoiceUpload(e: ChangeEvent<HTMLInputElement>) {
    if (!unit) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInvoice(true);
    setInvoiceError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/units/${unit.id}/invoice`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setInvoiceError(
        payload?.error ?? "Nepodařilo se nahrát fakturu."
      );
    } else {
      const payload = await res.json();
      // aktualizovat unit v paměti, aby se zobrazil odkaz
      setUnit((prev: any) =>
        prev
          ? {
              ...prev,
              invoice_path: payload.invoice_path ?? prev.invoice_path,
            }
          : prev
      );
    }

    setUploadingInvoice(false);
    // umožní nahrát stejný soubor znovu
    e.target.value = "";
  }

  if (loading && !unit) {
    return (
      <main className="max-w-2xl">
        <p className="text-sm text-gray-500">Načítám vozík…</p>
      </main>
    );
  }

  if (!unit) {
    return (
      <main className="max-w-2xl">
        <p className="text-sm text-red-600">
          Vozík nebyl nalezen nebo došlo k chybě.
        </p>
        {error && (
          <p className="text-sm text-red-600 mt-2">
            Detail: {error}
          </p>
        )}
        <Link
          href="/units"
          className="text-sm text-gray-600 hover:underline mt-4 inline-block"
        >
          Zpět na seznam vozíků
        </Link>
      </main>
    );
  }

  const currentCustomerName =
    customers.find((c) => c.id === customerId)?.name ??
    (unit.customer
      ? unit.customer.city
        ? `${unit.customer.name} (${unit.customer.city})`
        : unit.customer.name
      : null);

  const invoicePath: string | null = unit.invoice_path ?? null;
  const publicInvoiceUrl =
    invoicePath && process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/invoices/${invoicePath}`
      : null;

  return (
    <main className="space-y-6 max-w-2xl">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {unit.serial_number}
          </h2>
          <p className="text-sm text-gray-500">
            {unit.model || "Neznámý model"} • {statusLabel(status)}
          </p>
          {currentCustomerName && (
            <p className="text-sm text-gray-600">
              Zákazník:{" "}
              <span className="font-medium">{currentCustomerName}</span>
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Stav přípravy:{" "}
            <span className="font-medium">
              {prepStatusLabel(prepStatus)}
            </span>
          </p>
        </div>

        <Link
          href="/units"
          className="text-sm text-gray-600 hover:underline"
        >
          Zpět na seznam
        </Link>
      </header>

      <section className="space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Stav + prodej */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-800">
              Stav a prodejní informace
            </h3>
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
                  Stav přípravy
                </label>
                <select
                  value={prepStatus}
                  onChange={(e) =>
                    setPrepStatus(e.target.value as UnitPrepStatus)
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="neslozeno">Nesloženo</option>
                  <option value="slozeno">Složeno</option>
                  <option value="pripraveno">Připraveno k odeslání</option>
                  <option value="odeslano">Odesláno</option>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium mb-1">
                  Zákazník
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">– žádný –</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.city ? `${c.name} (${c.city})` : c.name}
                    </option>
                  ))}
                </select>
                {customersError && (
                  <p className="text-xs text-red-600 mt-1">
                    {customersError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Výrobní informace */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-800">
              Výrobní informace
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nákupní cena (Kč)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) =>
                    setPurchasePrice(e.target.value)
                  }
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
                  onChange={(e) =>
                    setPurchaseDate(e.target.value)
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
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

        {/* Faktura */}
        <div className="space-y-2 border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-800">
            Faktura k vozíku
          </h3>

          {publicInvoiceUrl ? (
            <p className="text-sm">
              Aktuální faktura:{" "}
              <a
                href={publicInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Otevřít fakturu
              </a>
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              K tomuto vozíku zatím není nahraná faktura.
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded-md bg-white hover:bg-gray-50 cursor-pointer">
              {uploadingInvoice ? "Nahrávám…" : "Nahrát / změnit fakturu"}
              <input
                type="file"
                accept=".pdf,image/*,.doc,.docx"
                className="hidden"
                onChange={handleInvoiceUpload}
              />
            </label>
            <p className="text-xs text-gray-500">
              Ideálně PDF, ale můžeš nahrát i obrázek nebo dokument.
            </p>
          </div>

          {invoiceError && (
            <div className="text-xs text-red-700 border border-red-200 bg-red-50 px-3 py-2 rounded-md">
              {invoiceError}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
