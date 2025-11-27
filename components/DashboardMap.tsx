"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// typ odpovědi z /api/dashboard/units-map
type UnitForMap = {
  id: string;
  model: string | null;
  sale_date: string | null;
  customer_city: string | null;
  postal_code: string | null;
  lat: number;
  lng: number;
};

// dynamicky vypnuté SSR pro mapu – pořád jeden soubor/komponenta
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
);
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false }
);
const Marker = dynamic(
  async () => (await import("react-leaflet")).Marker,
  { ssr: false }
);
const Popup = dynamic(
  async () => (await import("react-leaflet")).Popup,
  { ssr: false }
);

// default ikonka pro Leaflet (jinak je rozbitý obrázek)
const defaultIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
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

        const res = await fetch("/api/dashboard/units-map");
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          setError(
            payload?.error ?? "Nepodařilo se načíst data pro mapu."
          );
          setUnits([]);
          return;
        }

        const data = (await res.json()) as UnitForMap[];
        setUnits(data);
      } catch (e) {
        console.error(e);
        setError("Neočekávaná chyba při načítání mapy.");
        setUnits([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div className="h-80 rounded-lg border bg-white flex items-center justify-center text-sm text-gray-500">
        Načítám mapu…
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 rounded-lg border bg-red-50 flex items-center justify-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!units.length) {
    return (
      <div className="h-80 rounded-lg border bg-white flex items-center justify-center text-sm text-gray-500">
        Zatím žádné prodané vozíky.
      </div>
    );
  }

  // spočítáme průměr souřadnic, aby se mapa rozumně vycentrovala
  const center: LatLngExpression = [
    units.reduce((sum, u) => sum + u.lat, 0) / units.length,
    units.reduce((sum, u) => sum + u.lng, 0) / units.length,
  ];

  return (
    <div className="h-80 rounded-lg overflow-hidden border bg-white">
      {/* MapContainer už je client-only díky dynamic importům výše */}
      <MapContainer
        center={center}
        zoom={7}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">
            OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {units.map((u) => (
          <Marker key={u.id} position={[u.lat, u.lng]}>
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">
                  {u.model ?? "Vozík"}{" "}
                  {u.postal_code ? `(${u.postal_code})` : ""}
                </div>
                {u.customer_city && <div>{u.customer_city}</div>}
                {u.sale_date && (
                  <div>Prodáno: {u.sale_date}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
