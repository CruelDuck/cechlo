import "./globals.css";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import AppHeader from "@/components/AppHeader";

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
        {session && <AppHeader />}
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
