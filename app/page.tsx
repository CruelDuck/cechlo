import { createSupabaseServerClient } from '@/lib/supabaseServer';

async function getStats() {
  const supabase = createSupabaseServerClient();

  const [{ data: customers }, { data: leads }] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('status', 'lead')
  ]);

  return {
    totalCustomers: customers?.length ?? 0,
    totalLeads: leads?.length ?? 0
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <main className="space-y-4">
      <h2 className="text-lg font-semibold">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Kontakty celkem</div>
          <div className="mt-2 text-2xl font-semibold">{stats.totalCustomers}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Leadi</div>
          <div className="mt-2 text-2xl font-semibold">{stats.totalLeads}</div>
        </div>
      </div>
    </main>
  );
}
