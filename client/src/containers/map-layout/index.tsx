import { type ReactNode, Suspense } from "react";
import MapContainer from "@/containers/map";
import { PAGE_BACKGROUND } from "@/containers/map-layout/constants";
import MobileDataView from "@/containers/mobile-data-view";
import { MapMobileNav } from "@/containers/mobile-nav/map-mobile-nav";
import TopBar from "@/containers/top-bar";

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
        <section className="relative flex h-full overflow-hidden">
          <div className="contents max-lg:hidden">{sidebar}</div>

          <Suspense>
            <MapContainer />
            <MobileDataView />
            <MapMobileNav />
          </Suspense>
        </section>
      )}
    </main>
  );
}
