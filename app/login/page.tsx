'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectedFrom = searchParams.get('redirectedFrom') || '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError('Špatný email nebo heslo.');
      return;
    }

    router.push(redirectedFrom);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white border rounded-xl p-6 space-y-4 shadow-sm">
        <h1 className="text-lg font-semibold text-center">Přihlášení</h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ty@cechlo.cz"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Heslo</label>
            <input
              type="password"
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md border bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Přihlašuji…' : 'Přihlásit se'}
          </button>
        </form>

        <p className="mt-2 text-xs text-gray-500 text-center">
          Zapomněl jsi heslo?{" "}
          <Link
            href="/auth/forgot-password"
            className="text-blue-600 hover:underline"
          >
            Obnovit heslo
          </Link>
        </p>
      </div>
    </main>
  );
}
