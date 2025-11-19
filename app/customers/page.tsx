// app/customers/page.tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

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

async function getCustomers(status?: Status): Promise<{
  data: CustomerRow[];
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();

    let query = supabase
      .from("customers")
      .select("id, name, city, phone, status")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error in getCustomers:", error);
      return { data: [], error: error.message ?? "Neznámá chyba Supabase" };
    }

    return { data: (data ?? []) as CustomerRow[], error: null };
  } catch (e: any) {
    console.error("Unexpected error in getCustomers:", e);
    return { data: [], error: "Neočekávaná chyba serveru při načítání kontaktů." };
  }
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: { status?: Status };
}) {
  const status = searchParams?.status;
  const { data: customers, error } = await getCustomers(status);

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
        <FilterButton label="Všichni" href="/customers" active={!status} />
        <FilterButton label="Lead" href="/customers?status=lead" active={status === "lead"} />
        <FilterButton
          label="Qualified"
          href="/customers?status=qualified"
          active={status === "qualified"}
        />
        <FilterButton
          label="Negotiation"
          href="/customers?status=negotiation"
          active={status === "negotiation"}
        />
        <FilterButton
          label="Customer"
          href="/customers?status=customer"
          active={status === "customer"}
        />
      </div>

      {/* Chybová hláška */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Chyba při načítání kontaktů: {error}
        </div>
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
            {customers.length === 0 && !error && (
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
                onClick={() => (window.location.href = `/customers/${c.id}`)}
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
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-full border ${
        active ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}
