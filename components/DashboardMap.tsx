// components/DashboardMap.tsx
"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type UnitForMap = {
  id: string;
  serial_number: string;
  model: string | null;
  sale_date: string | null;
  customer_city: string | null;
  customer_name: string | null;
};

const CITY_COORDS: Record<
  string,
  { lat: number; lng: number }
> = {
  // Sem si můžeš postupně dopisovat města, kde máš zákazníky
  "Praha": { lat: 50.0755, lng: 14.4378 },
  "Štětí": { lat: 50.4527, lng: 14.3747 },
  "Holice": { lat: 50.065, lng: 15.986 },
  "Opava": { lat: 49.9387, lng: 17.9026 },
  "Louny": { lat: 50.356, lng: 13.796 },
  "Kladno": { lat: 50.1435, lng: 14.1029 },
  "Pardubice": { lat: 50.0343, lng: 15.7812 },
  // fallback – když máš v DB "Pardubice - Pardubičky", dá se to namapovat ručně:
  "Pardubice - Pardubičky": { lat: 50.028, lng: 15.789 },
  // atd...
};

// Oprava defaultního ikony Leafletu v bundleru
const defaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

export default function DashboardMap() {
  const [units, setUnits] = useState<UnitForMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/units?status=sold");

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(
            payload?.error ?? "Nepodařilo se načíst data pro mapu."
          );
          setUnits([]);
          return;
        }

        const raw = await res.json();

        // Očekáváme, že /api/units vrací i customer_city / customer_name
        const mapped: UnitForMap[] = (raw as any[]).map((u) => ({
          id: u.id,
          serial_number: u.serial_number,
          model: u.model ?? null,
          sale_date: u.sale_date ?? null,
          customer_city: u.customer_city ?? null,
          customer_name: u.customer_name ?? null,
        }));

        setUnits(mapped);
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání dat pro mapu.");
        setUnits([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  // Markery jen tam, kde známe město a máme pro něj souřadnice
  const markers = units
    .filter((u) => u.customer_city && CITY_COORDS[u.customer_city])
    .map((u) => {
      const coords = CITY_COORDS[u.customer_city as string]!;
      return { ...u, ...coords };
    });

  // Střed mapy – ČR
  const center: [number, number] = [49.8, 15.5];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        Prodáné vozíky – mapa (podle města zákazníka)
      </h2>

      {loading && (
        <p className="text-sm text-gray-500">
          Načítám data pro mapu…
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && markers.length === 0 && (
        <p className="text-sm text-gray-500">
          Zatím nemám žádné prodané vozíky se známým městem v mapě.
        </p>
      )}

      {!loading && !error && markers.length > 0 && (
        <div className="h-80 w-full rounded-lg overflow-hidden border">
          <MapContainer
            center={center}
            zoom={7}
            scrollWheelZoom={false}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map((m) => (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
              >
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold">
                      {m.customer_name ?? "Neznámý zákazník"}
                    </div>
                    <div>{m.customer_city}</div>
                    <div className="mt-1">
                      Vozík:{" "}
                      <span className="font-mono">
                        {m.serial_number}
                      </span>
                    </div>
                    {m.model && (
                      <div>Model: {m.model}</div>
                    )}
                    {m.sale_date && (
                      <div>Prodej: {m.sale_date}</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Malý text, co vysvětluje omezení */}
      <p className="text-[11px] text-gray-500">
        Mapu teď počítám jen podle měst a staticky zadaných
        souřadnic. Postupně můžeš doplnit další města do
        slovníku <code>CITY_COORDS</code> nebo později
        přidáme do databáze přímo souřadnice zákazníků.
      </p>
    </div>
  );
}
