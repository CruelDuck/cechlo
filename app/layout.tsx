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
            <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col gap-2">
              {/* První řádek: logo + odhlášení */}
              <div className="flex items-center justify-between">
                {/* Logo je klikací – vede na dashboard (/) */}
                <Link href="/" className="flex items-center">
                  <span className="text-lg font-semibold tracking-tight">
                    Čechlo
                  </span>
                </Link>

                <form action="/auth/signout" method="post">
                  <button className="text-gray-300 hover:text-white text-sm">
                    Odhlásit se
                  </button>
                </form>
              </div>

              {/* Druhý řádek: navigace – viditelná i na mobilu */}
              <nav className="flex flex-wrap items-center gap-1">
                <Link
                  href="/units"
                  className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium text-gray-200 hover:bg-gray-800"
                >
                  Vozíky
                </Link>
                <Link
                  href="/customers"
                  className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium text-gray-200 hover:bg-gray-800"
                >
                  Kontakty
                </Link>
                <Link
                  href="/parts"
                  className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium text-gray-200 hover:bg-gray-800"
                >
                  Sklad
                </Link>
                {/* Newsletter odstraněn */}
              </nav>
            </div>
          </header>
        )}

        {/* Obsah */}
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
