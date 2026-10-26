import { type ReactNode, Suspense } from "react";
import MapContainer from "@/containers/map";
import { PAGE_BACKGROUND } from "@/containers/map-layout/constants";
import MobileDataView from "@/containers/mobile-data-view";
import { MobileMenu, MobileMenuArea } from "@/containers/mobile-menu";
import { AnalysisMobileNav } from "@/containers/mobile-nav/analysis-mobile-nav";
import { MapMobileNav } from "@/containers/mobile-nav/map-mobile-nav";
import MobileResultsView from "@/containers/mobile-results-view";
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
        <MobileMenu>
          <TopBar />
          <MobileMenuArea>
            {sidebar === undefined ? (
              children
            ) : (
              <section className="relative flex h-full overflow-hidden">
                <div className="contents max-lg:hidden">{sidebar}</div>

                <Suspense>
                  <MapContainer />
                  <MobileDataView />
                  <MobileResultsView />
                  <MapMobileNav />
                  <AnalysisMobileNav />
                </Suspense>
              </section>
            )}
          </MobileMenuArea>
        </MobileMenu>
      </Suspense>
    </main>
  );
}
