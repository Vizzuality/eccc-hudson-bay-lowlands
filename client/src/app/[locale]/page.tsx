import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import MapContainer from "@/containers/map";
import MapSidebar from "@/containers/map-sidebar";
import TopBar from "@/containers/top-bar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.home" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Home() {
  return (
    <main
      className="h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(113.99% 208.31% at 0% 0%, var(--slate-200, #E2E8F0) 0%, var(--base-white, #FFF) 50.96%, var(--emerald-50, #ECFDF5) 100%), #FFF",
      }}
    >
      <Suspense>
        <TopBar />
      </Suspense>

      <section className="flex h-full overflow-hidden">
        <Suspense>
          <MapSidebar />
        </Suspense>

        <Suspense>
          <MapContainer className="flex-1 rounded-tl-3xl" />
        </Suspense>
      </section>
    </main>
  );
}
