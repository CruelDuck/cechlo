// components/DashboardMap.tsx
"use client";

import { useEffect, useState } from "react";

type UnitPoint = {
  id: string;
  model: string | null;
  sale_date: string | null;
  customer_city: string | null;
  postal_code: string | null;
  lat: number;
  lng: number;
};

export default function DashboardMap() {
  const [points, setPoints] = useState<UnitPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/dashboard/units-map");
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(
            payload?.error ?? "Nepodařilo se načíst data pro mapu."
          );
          setPoints([]);
          return;
        }

        const data = (await res.json()) as UnitPoint[];
        setPoints(data);
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání mapy.");
        setPoints([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
        Načítám polohu prodaných vozíků…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
        Zatím žádná data o prodaných vozících s vyplněným PSČ.
      </div>
    );
  }

  // spočteme min/max kvůli “normalizaci” do 0–100 %
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  function projectLat(lat: number) {
    if (maxLat === minLat) return 50;
    return ((lat - minLat) / (maxLat - minLat)) * 100;
  }

  function projectLng(lng: number) {
    if (maxLng === minLng) return 50;
    return ((lng - minLng) / (maxLng - minLng)) * 100;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {/* pseudo-mapa */}
      <div className="relative rounded-lg border bg-gradient-to-br from-sky-50 via-emerald-50 to-slate-100 p-2 h-72 overflow-hidden">
        {/* jemná mřížka */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,#cbd5f5_1px,transparent_0)] bg-[length:24px_24px]" />
        </div>

        {/* body */}
        <div className="relative w-full h-full">
          {points.map((p) => {
            const top = 100 - projectLat(p.lat); // aby sever byl nahoře
            const left = projectLng(p.lng);

            return (
              <div
                key={p.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${top}%`, left: `${left}%` }}
              >
                <div className="h-3 w-3 rounded-full bg-emerald-600 shadow-md border border-white" />
              </div>
            );
          })}
        </div>
      </div>

      {/* seznam míst */}
      <div className="rounded-lg border bg-white p-3 text-sm max-h-72 overflow-auto">
        <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Místa, kde jezdí Čechlo
        </h4>
        <ul className="space-y-1">
          {points.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 border-b last:border-b-0 py-1"
            >
              <div>
                <div className="font-medium text-gray-800">
                  {p.customer_city ?? "Neznámé město"}
                </div>
                <div className="text-xs text-gray-500">
                  PSČ: {p.postal_code ?? "—"}
                  {p.model && ` · model ${p.model}`}
                </div>
              </div>
              {p.sale_date && (
                <span className="text-[11px] text-gray-500 whitespace-nowrap">
                  {p.sale_date}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
