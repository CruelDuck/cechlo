"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/units", label: "Vozíky" },
  { href: "/customers", label: "Kontakty" },
  { href: "/parts", label: "Sklad" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="bg-black text-white shadow-md">
      {/* Horní řádek: logo + desktop nav + logout */}
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo + desktop navigace */}
        <div className="flex items-center gap-4">
          {/* Logo – klik na dashboard */}
          <Link href="/" className="flex items-center">
            <span className="text-lg font-semibold tracking-tight">
              Čechlo
            </span>
          </Link>

          {/* Desktop navigace */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium
                  ${
                    isActive(item.href)
                      ? "bg-gray-200 text-black"
                      : "text-gray-200 hover:bg-gray-800"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout + hamburger */}
        <div className="flex items-center gap-3">
          {/* Desktop logout */}
          <form action="/auth/signout" method="post" className="hidden sm:block">
            <button
              type="submit"
              className="text-gray-300 hover:text-white text-sm"
            >
              Odhlásit se
            </button>
          </form>

          {/* Hamburger jen na mobilu / tabletu */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md border border-gray-700 p-1.5 text-gray-200 hover:bg-gray-800"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <span className="block w-4 h-[2px] bg-gray-200 mb-[3px]" />
            <span className="block w-4 h-[2px] bg-gray-200 mb-[3px]" />
            <span className="block w-4 h-[2px] bg-gray-200" />
          </button>
        </div>
      </div>

      {/* Mobilní rozbalovací menu */}
      {open && (
        <div className="md:hidden border-t border-gray-800 bg-black/95">
          <nav className="max-w-5xl mx-auto px-4 py-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full px-3 py-2 rounded-md text-sm
                  ${
                    isActive(item.href)
                      ? "bg-gray-200 text-black"
                      : "text-gray-200 hover:bg-gray-800"
                  }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* Logout v mobilním menu */}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 rounded-md"
              >
                Odhlásit se
              </button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}

