import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const metadata = {
  title: "Čechlo Inventory",
  description: "Interní správa vozíků, kontaktů a skladových zásob.",
};

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const active =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition
      ${active ? "bg-white text-black" : "text-gray-200 hover:bg-gray-800"}
      `}
    >
      {label}
    </Link>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="cs">
      <body className="bg-gray-100">
        {/* TOP BAR */}
        {session && (
          <header className="bg-black text-white shadow-md">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              {/* LEFT */}
              <div className="flex items-center gap-6">
                <h1 className="text-lg font-semibold tracking-tight">
                  Čechlo
                </h1>

                <nav className="hidden sm:flex items-center gap-1">
                  <NavLink href="/units" label="Vozíky" />
                  <NavLink href="/customers" label="Kontakty" />
                  <NavLink href="/parts" label="Sklad" />
                  <NavLink href="/newsletter" label="Newsletter" />
                </nav>
              </div>

              {/* RIGHT */}
              <form action="/auth/signout" method="post">
                <button className="text-gray-300 hover:text-white text-sm">
                  Odhlásit se
                </button>
              </form>
            </div>
          </header>
        )}

        {/* MAIN CONTENT */}
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
