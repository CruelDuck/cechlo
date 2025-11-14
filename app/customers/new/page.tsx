'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CustomerStatus } from '@/lib/types';

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<CustomerStatus>('lead');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const res = await fetch('/api/customers', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? 'Nepodařilo se uložit kontakt.');
      setLoading(false);
      return;
    }

    router.push('/customers');
    router.refresh();
  }

  return (
    <main className="max-w-xl mx-auto space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Nový kontakt</h2>
        <p className="text-sm text-gray-500">
          Založ lead nebo zákazníka. Později ho můžeš propojit s prodejem vozíku.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg border p-4">
        <div>
          <label className="block text-sm font-medium mb-1">Jméno / firma</label>
          <input
            name="name"
            required
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Např. Jan Novák / Stáj U Dubu"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Telefon</label>
            <input
              name="phone"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="+420 777 000 000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="jan.novak@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Město</label>
          <input
            name="city"
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Praha"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as CustomerStatus)}
            >
              <option value="lead">Lead</option>
              <option value="customer">Zákazník</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="is_hot"
              name="is_hot"
              type="checkbox"
              className="h-4 w-4"
            />
            <label htmlFor="is_hot" className="text-sm">
              Horký lead
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Další akce (datum)</label>
          <input
            name="next_action_at"
            type="date"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Poznámka</label>
          <textarea
            name="note"
            rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Např. chce zavolat v březnu, zajímá se o EH50..."
          />
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-md border text-sm bg-white hover:bg-gray-50"
          >
            Zpět
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md border text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Ukládám…' : 'Uložit kontakt'}
          </button>
        </div>
      </form>
    </main>
  );
}
