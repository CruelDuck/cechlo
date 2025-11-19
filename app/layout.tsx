// app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Čechlo Inventory',
  description: 'Evidence vozíků, zákazníků, leadů a prodejů pro Čechlo',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-5xl mx-auto p-4">
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Čechlo Inventory
              </h1>
              <p className="text-xs text-gray-500">
                Interní systém pro evidenci vozíků, zákazníků a leadů
              </p>
            </div>

            <div className="flex items-center gap-4 justify-between sm:justify-end">
              <nav className="flex gap-4 text-sm">
                <a href="/" className="hover:underline">
                  Dashboard
                </a>
                <a href="/customers" className="hover:underline">
                  Zákazníci &amp; leadi
                </a>
                {/* Sem později klidně přidáme /units, /sales atd. */}
              </nav>

              {/* 
              Až budeš mít LogoutButton (client komponentu), můžeš sem dát:
              <LogoutButton />
              */}
            </div>
          </header>

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
