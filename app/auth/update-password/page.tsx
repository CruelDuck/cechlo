// app/auth/update-password/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // 1) posloucháme PASSWORD_RECOVERY – když přijde, víme, že Supabase vytvořil session
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY' && session) {
        setAuthReady(true);
      }
    });

    // 2) fallback – když už je session uložená (třeba po refreshi stránky)
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data?.session) {
        setAuthReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků.');
      return;
    }

    if (password !== password2) {
      setError('Hesla se neshodují.');
      return;
    }

    setLoading(true);

    const { error } = await supabaseBrowser.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();

      if (msg.includes('auth session missing')) {
        setError(
          'Odkaz pro změnu hesla už neplatí nebo nebyl otevřen přímo z e-mailu. ' +
          'Požádej prosím o nové resetovací heslo a klikni na nový odkaz.'
        );
      } else if (msg.includes('invalid') || msg.includes('expired')) {
        setError(
          'Odkaz pro změnu hesla je neplatný nebo vypršel. Zkus prosím znovu požádat o reset hesla.'
        );
      } else {
        setError(
          'Nepodařilo se změnit heslo. Zkus to prosím znovu, případně pošli screenshot chyby.'
        );
      }

      // jakmile máme chybu, formulář už NEBUDE „připravovací“
      setAuthReady(true);
      return;
    }

    setSuccess('Heslo bylo úspěšně změněno. Můžeš se přihlásit novým heslem.');
    setAuthReady(true);

    setTimeout(() => {
      router.push('/login');
      router.refresh();
    }, 2000);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white border rounded-xl p-6 space-y-4 shadow-sm">
        <h1 className="text-lg font-semibold text-center">
          Nastavení nového hesla
        </h1>

        {/* Info text – ukáže se jen když ještě nevíme, jestli je odkaz ok a není chyba */}
        {!authReady && !error && (
          <p className="text-xs text-gray-500">
            Ověřuji odkaz z e-mailu…<br />
            Pokud tahle obrazovka nezmizí, klikni prosím znovu na odkaz pro reset
            hesla v e-mailu.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Nové heslo</label>
            <input
              type="password"
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Potvrzení hesla</label>
            <input
              type="password"
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md border bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Ukládám…' : 'Uložit nové heslo'}
          </button>
        </form>
      </div>
    </main>
  );
}
