// app/page.tsx (dashboard)
import { UnitsMap } from "./_components/UnitsMap"; // podle umístění

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      {/* ... kartičky, to-do, poslední aktivity ... */}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">
          Kde všude už jezdí Čechlo vozíky
        </h3>
        <p className="text-xs text-gray-500">
          Mapa prodaných vozíků podle města zákazníka.
        </p>
        <UnitsMap />
      </section>
    </main>
  );
}
