"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

type UnitMarker = {
  id: string;
  serial_number: string;
  model: string | null;
  sale_date: string | null;
  customer_name: string | null;
  city: string | null;
  lat: number;
  lng: number;
};

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

export function UnitsMap() {
  const [markers, setMarkers] = useState<UnitMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/units-map");
        if (!res.ok) return;
        const data = (await res.json()) as any[];
        setMarkers(
          data.filter((m) => typeof m.lat === "number" && typeof m.lng === "number")
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-500">Načítám mapu…</p>;
  }

  if (!markers.length) {
    return (
      <p className="text-sm text-gray-500">
        Zatím nemám žádné prodané vozíky s nastavenou polohou.
      </p>
    );
  }

  // jednoduché výchozí centrum – třeba střed ČR
  const center: [number, number] = [49.8, 15.5];

  return (
    <div className="h-72 rounded-lg overflow-hidden border">
      <MapContainer center={center} zoom={7} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OSM přispěvatelé'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{m.customer_name ?? "Bez názvu"}</div>
                {m.city && <div>{m.city}</div>}
                <div>{m.model ?? "Vozík"}</div>
                <div className="font-mono text-xs">{m.serial_number}</div>
                {m.sale_date && <div>Prodáno: {m.sale_date}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
