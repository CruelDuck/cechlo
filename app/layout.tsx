import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Čechlo Inventory',
  description: 'Evidence vozíků, zákazníků a leadů'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen">
        <div className="max-w-5xl mx-auto p-4">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Čechlo Inventory</h1>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:underline">Dashboard</a>
              <a href="/customers" className="hover:underline">Zákazníci &amp; leadi</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
