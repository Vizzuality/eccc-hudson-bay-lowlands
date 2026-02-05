import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import MapContainer from "@/containers/map";
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
  const t = useTranslations("map");
  return (
    <main className="h-screen">
      <TopBar />
      <section className="grid grid-cols-3 h-full">
        <aside className="col-span-1 px-6">
          <header>
            <h1>{t("title")}</h1>
            <p>
              Explore and combine geographical data overlays. Analyze your area
              of interest and get custom insights
            </p>
          </header>
        </aside>
        <MapContainer className="col-span-2 rounded-tl-3xl"></MapContainer>
      </section>
    </main>
  );
}
