"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";

export default function UpdatePasswordPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [saving, setSaving] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 1) Po příchodu z e-mailu vyměníme ?code=... za session
  useEffect(() => {
    async function prepareSession() {
      setError(null);
      const code = searchParams.get("code");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("exchangeCodeForSession error", error);
            setError(
              "Odkaz pro změnu hesla už neplatí nebo je neplatný. Zkus prosím poslat reset znovu."
            );
            return;
          }
        } else {
          // možná už je user přihlášen – pro jistotu ověříme
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            setError(
              "Chybí ověření odkazu. Otevři prosím stránku přes odkaz v e-mailu pro reset hesla."
            );
            return;
          }
        }

        setAuthReady(true);
      } catch (e) {
        console.error(e);
        setError("Nepodařilo se ověřit odkaz pro změnu hesla.");
      }
    }

    prepareSession();
  }, [searchParams, supabase]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!authReady) {
      setError("Ještě ověřuji odkaz pro reset hesla, zkus to prosím za chvíli.");
      return;
    }

    if (password.length < 8) {
      setError("Heslo musí mít alespoň 8 znaků.");
      return;
    }

    if (password !== passwordAgain) {
      setError("Hesla se neshodují.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error(error);
        setError(error.message || "Nepodařilo se změnit heslo.");
        setSuccess(false);
      } else {
        setSuccess(true);
        // po úspěchu pošleme uživatele na login
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setError("Neočekávaná chyba při změně hesla.");
      setSuccess(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold mb-1">Nové heslo</h1>
        <p className="text-sm text-gray-500 mb-4">
          Nastav si nové heslo pro svůj účet. Tuhle stránku vždy otevírej jen
          přes odkaz v e-mailu pro reset hesla.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="password"
            >
              Nové heslo
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="passwordAgain"
            >
              Nové heslo znovu
            </label>
            <input
              id="passwordAgain"
              type="password"
              required
              minLength={8}
              value={passwordAgain}
              onChange={(e) => setPasswordAgain(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && !error && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              Heslo bylo úspěšně změněno. Přesměrovávám na přihlášení…
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !authReady}
            className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
          >
            {!authReady
              ? "Připravuji formulář…"
              : saving
              ? "Ukládám…"
              : "Uložit nové heslo"}
          </button>
        </form>
      </div>
    </main>
  );
}
