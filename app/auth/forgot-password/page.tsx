"use client";

import { FormEvent, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ForgotPasswordPage() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      if (!email.trim()) {
        setError("Zadej prosím e-mail.");
        setSending(false);
        return;
      }

      // Origin = aktuální doména (funguje na localhostu i na Vercelu)
      const origin = window.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${origin}/auth/update-password`,
        }
      );

      if (error) {
        console.error(error);
        setError(error.message || "Nepodařilo se odeslat e-mail.");
        setSent(false);
      } else {
        setSent(true);
      }
    } catch (e) {
      console.error(e);
      setError("Neočekávaná chyba při odesílání e-mailu.");
      setSent(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold mb-1">Zapomenuté heslo</h1>
        <p className="text-sm text-gray-500 mb-4">
          Zadej e-mail, na který ti pošleme odkaz pro nastavení nového hesla.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="např. ty@cechlo.cz"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {sent && !error && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              Pokud u nás tento e-mail existuje, poslali jsme na něj odkaz pro
              reset hesla.
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
          >
            {sending ? "Odesílám…" : "Odeslat resetovací e-mail"}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500">
          Zkontroluj i složku se spamem nebo „Hromadné“, občas tam tyhle maily
          spadnou.
        </p>
      </div>
    </main>
  );
}
