import { type ReactNode, Suspense } from "react";
import MapContainer from "@/containers/map";
import TopBar from "@/containers/top-bar";

const PAGE_BACKGROUND = {
  background:
    "radial-gradient(113.99% 208.31% at 0% 0%, var(--slate-200, #E2E8F0) 0%, var(--base-white, #FFF) 50.96%, var(--emerald-50, #ECFDF5) 100%), #FFF",
} as const;

type MapLayoutProps =
  | { sidebar: ReactNode; children?: never }
  | { children: ReactNode; sidebar?: never };

export default function MapLayout({
  sidebar,
  children,
}: Readonly<MapLayoutProps>) {
  return (
    <main className="flex min-h-0 flex-1 flex-col" style={PAGE_BACKGROUND}>
      <Suspense>
        <TopBar />
      </Suspense>

      {sidebar === undefined ? (
        children
      ) : (
        <section className="flex h-full overflow-hidden">
          {sidebar}

          <Suspense>
            <MapContainer />
          </Suspense>
        </section>
      )}
    </main>
  );
}
