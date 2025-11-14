import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { Customer, CustomerStatus } from '@/lib/types';

async function getCustomers(status?: CustomerStatus): Promise<Customer[]> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading customers', error);
    return [];
  }

  return (data ?? []) as Customer[];
}

export default async function CustomersPage({
  searchParams
}: {
  searchParams?: { status?: CustomerStatus };
}) {
  const status = searchParams?.status;
  const customers = await getCustomers(status);

  return (
    <main className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Zákazníci &amp; leadi</h2>
          <p className="text-sm text-gray-500">
            Přehled všech kontaktů – můžeš filtrovat podle stavu.
          </p>
        </div>
        <a
          href="/customers/new"
          className="px-4 py-2 rounded-md border text-sm font-medium bg-white hover:bg-gray-50"
        >
          + Nový kontakt
        </a>
      </header>

      <div className="flex gap-2 text-sm">
        <a
          href="/customers"
          className={`px-3 py-1 rounded-full border ${
            !status ? 'bg-gray-900 text-white' : 'bg-white'
          }`}
        >
          Všichni
        </a>
        <a
          href="/customers?status=lead"
          className={`px-3 py-1 rounded-full border ${
            status === 'lead' ? 'bg-gray-900 text-white' : 'bg-white'
          }`}
        >
          Leadi
        </a>
        <a
          href="/customers?status=customer"
          className={`px-3 py-1 rounded-full border ${
            status === 'customer' ? 'bg-gray-900 text-white' : 'bg-white'
          }`}
        >
          Zákazníci
        </a>
      </div>

      <section className="rounded-lg border bg-white divide-y">
        {customers.length === 0 && (
          <div className="p-4 text-sm text-gray-500">Žádná data k zobrazení.</div>
        )}

        {customers.map((c) => (
          <div
            key={c.id}
            className="p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    c.status === 'lead'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {c.status === 'lead' ? 'Lead' : 'Zákazník'}
                </span>
                {c.is_hot && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    HOT
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                {c.phone && <span>{c.phone}</span>}
                {c.email && <span>{c.email}</span>}
                {c.city && <span>{c.city}</span>}
              </div>
            </div>
            <div className="text-right text-xs text-gray-500 space-y-1">
              {c.next_action_at && (
                <div>
                  Další akce:{' '}
                  <span className="font-medium">
                    {new Date(c.next_action_at).toLocaleDateString('cs-CZ')}
                  </span>
                </div>
              )}
              <div>
                Vytvořeno:{' '}
                {new Date(c.created_at).toLocaleDateString('cs-CZ')}
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
