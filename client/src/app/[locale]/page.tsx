import { getTranslations } from "next-intl/server";
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
    <main className="h-screen flex flex-col">
      <TopBar />
      <section className="flex h-full">
        <MapSidebar />
        <MapContainer className="flex-1 rounded-tl-3xl"></MapContainer>
      </section>
    </main>
  );
}
