"use client";

import { useEffect, useState } from "react";

type MapPoint = {
  id: string;
  serial_number: string;
  model: string | null;
  sale_date: string | null;
  customer_id: string | null;
  customer_name: string | null;
  city: string | null;
  zip: string;
  lat: number;
  lng: number;
};

export default function DashboardMap() {
  const [points, setPoints] = useState<MapPoint[]>([]);
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
          setError(payload?.error ?? "Nepodařilo se načíst data pro mapu.");
          setPoints([]);
          return;
        }

        const data = (await res.json()) as MapPoint[];
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

  // „bounding box“ ČR – hrubý obdélník pro převod lat/lng na % pozici
  const MIN_LAT = 48.5;
  const MAX_LAT = 51.1;
  const MIN_LNG = 12.0;
  const MAX_LNG = 19.0;

  function toX(lng: number) {
    const ratio = (lng - MIN_LNG) / (MAX_LNG - MIN_LNG);
    return Math.min(100, Math.max(0, ratio * 100));
  }

  function toY(lat: number) {
    const ratio = (lat - MIN_LAT) / (MAX_LAT - MIN_LAT);
    // na obrazovce chceme mít sever nahoře => invertujeme
    return Math.min(100, Math.max(0, (1 - ratio) * 100));
  }

  return (
    <div className="space-y-3">
      <div className="relative w-full rounded-lg border bg-gradient-to-b from-sky-50 to-emerald-50 p-2 h-64 overflow-hidden">
        {/* pseudo-obrys ČR – jen orientační */}
        <div className="absolute inset-4 rounded-full border border-dashed border-emerald-300 opacity-60" />

        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
            Načítám polohu prodaných vozíků…
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-red-600 px-4 text-center">
            {error}
          </div>
        )}

        {!loading && !error && points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 px-4 text-center">
            Zatím nemáš žádné prodané vozíky s PSČ, které by šlo zobrazit na mapě.
          </div>
        )}

        {/* body na mapě */}
        {points.map((p) => {
          const x = toX(p.lng);
          const y = toY(p.lat);

          return (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
              title={`${p.customer_name ?? "Neznámý zákazník"} – ${
                p.city ?? ""
              } (${p.zip})`}
            >
              <div className="h-3 w-3 rounded-full bg-emerald-600 shadow-md shadow-emerald-400/70 border border-white" />
            </div>
          );
        })}
      </div>

      {/* Malý seznam pod mapou – textová legenda */}
      {!loading && !error && points.length > 0 && (
        <div className="rounded-md border bg-white p-2 max-h-40 overflow-auto text-xs">
          <p className="mb-1 font-semibold text-gray-700">
            Seznam prodaných vozíků podle místa:
          </p>
          <ul className="space-y-1">
            {points.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span>
                  {p.customer_name ?? "Neznámý zákazník"}{" "}
                  {p.city ? `– ${p.city}` : ""} ({p.zip})
                </span>
                <span className="text-gray-500">
                  {p.model ?? "vozík"} · {p.serial_number}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
