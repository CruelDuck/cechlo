// components/DashboardMap.tsx
"use client";

import { useEffect, useState } from "react";

type UnitRow = {
  id: string;
  status: string;
  customer_city: string | null;
  warehouse_location: string | null;
};

type CityStat = {
  city: string;
  count: number;
};

export default function DashboardMap() {
  const [stats, setStats] = useState<CityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // vezmeme jen prodané vozíky, aby mapa ukazovala zákazníky
        const res = await fetch("/api/units?status=sold");

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(payload?.error ?? "Nepodařilo se načíst data pro mapu.");
          setStats([]);
          return;
        }

        const data = (await res.json()) as UnitRow[];

        const counts = new Map<string, number>();

        for (const u of data) {
          const city = (u.customer_city || u.warehouse_location || "Neznámé místo").trim();
          if (!city) continue;
          counts.set(city, (counts.get(city) ?? 0) + 1);
        }

        const list: CityStat[] = Array.from(counts.entries())
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));

        setStats(list);
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání dat pro mapu.");
        setStats([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div className="h-72 rounded-lg border bg-white flex items-center justify-center text-sm text-gray-500">
        Načítám rozložení vozíků…
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-72 rounded-lg border bg-white flex items-center justify-center text-sm text-red-600 px-4 text-center">
        {error}
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="h-72 rounded-lg border bg-white flex items-center justify-center text-sm text-gray-500 px-4 text-center">
        Zatím nejsou žádné prodané vozíky, které by šlo zobrazit na mapě.
      </div>
    );
  }

  return (
    <div className="h-72 rounded-lg border bg-white p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          Přehled podle města zákazníka
        </span>
        <span className="text-xs text-gray-400">
          Celkem míst: {stats.length}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <ul className="divide-y text-sm">
          {stats.map((row) => (
            <li
              key={row.city}
              className="flex items-center justify-between py-1.5"
            >
              <span className="truncate">{row.city}</span>
              <span className="ml-3 inline-flex min-w-[2.5rem] justify-end text-xs font-semibold text-gray-700">
                × {row.count}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-2 text-[11px] text-gray-400">
        Ve fázi 1 jen seznam měst. Později můžeme doplnit skutečnou mapu
        (Leaflet / Mapbox) s tečkami podle regionů.
      </p>
    </div>
  );
}
