import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const metadata = {
  title: "Čechlo Inventory",
  description: "Interní správa vozíků, kontaktů a skladových zásob.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Supabase klient bez typování Database – to je plně v pohodě
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="cs">
      <body className="bg-gray-100">
        {/* Horní lišta jen pokud je uživatel přihlášen */}
        {session && (
          <header className="bg-black text-white shadow-md">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              {/* Vlevo logo + navigace */}
              <div className="flex items-center gap-6">
                <h1 className="text-lg font-semibold tracking-tight">
                  Čechlo
                </h1>

                <nav className="hidden sm:flex items-center gap-1">
                  <Link
                    href="/units"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-200 hover:bg-gray-800"
                  >
                    Vozíky
                  </Link>
                  <Link
                    href="/customers"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-200 hover:bg-gray-800"
                  >
                    Kontakty
                  </Link>
                  <Link
                    href="/parts"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-200 hover:bg-gray-800"
                  >
                    Sklad
                  </Link>
                  <Link
                    href="/newsletter"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-200 hover:bg-gray-800"
                  >
                    Newsletter
                  </Link>
                </nav>
              </div>

              {/* Vpravo odhlášení */}
              <form action="/auth/signout" method="post">
                <button className="text-gray-300 hover:text-white text-sm">
                  Odhlásit se
                </button>
              </form>
            </div>
          </header>
        )}

        {/* Obsah */}
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
