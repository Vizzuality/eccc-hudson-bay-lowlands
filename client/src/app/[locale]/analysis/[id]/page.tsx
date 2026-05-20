"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlertIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, Suspense, useLayoutEffect } from "react";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import { AnalysisProvider } from "@/containers/analysis/analysis-context";
import AnalysisPanelContent from "@/containers/analysis/panel-content";
import DataLayersPanel from "@/containers/data-layers/panel";
import MapContainer from "@/containers/map";
import ShareButton from "@/containers/share-button";
import { SharedAnalysisSkeleton } from "@/containers/skeletons";
import TopBar from "@/containers/top-bar";
import useAnalysisSettings, {
  useAnalysisResult,
  useSetAnalysisResult,
} from "@/hooks/use-analysis-settings";
import { API } from "@/lib/api";
import { getSharedAnalysisConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type { ParsedGeoJSON } from "@/lib/utils/geometry-upload";
import type { SharedAnalysisResponse } from "@/types";

const PAGE_BACKGROUND = {
  background:
    "radial-gradient(113.99% 208.31% at 0% 0%, var(--slate-200, #E2E8F0) 0%, var(--base-white, #FFF) 50.96%, var(--emerald-50, #ECFDF5) 100%), #FFF",
} as const;

function SharedAnalysisHydrator({
  data,
  children,
}: {
  data: SharedAnalysisResponse;
  children: ReactNode;
}) {
  const setAnalysisResult = useSetAnalysisResult();
  const [, setSettings] = useAnalysisSettings();
  const { setMapStatus } = useMapStatus();
  const analysisResult = useAnalysisResult();

  useLayoutEffect(() => {
    setAnalysisResult(data.analysis);
    setSettings({
      locationType: "upload",
      geometry: data.geojson as ParsedGeoJSON,
      fileName: null,
    });
    setMapStatus(MapStatus.analysis);

    return () => {
      setAnalysisResult(null);
    };
  }, [data, setAnalysisResult, setSettings, setMapStatus]);

  if (!analysisResult) return <SharedAnalysisSkeleton />;

  return children;
}

function SharedAnalysisError() {
  const t = useTranslations("shared-analysis");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <CircleAlertIcon className="text-muted-foreground size-12" />
      <h1 className="text-2xl font-normal">{t("expired-title")}</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        {t("expired-description")}
      </p>
    </div>
  );
}

export default function SharedAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/analysis/${id}`
      : "";

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.sharedAnalysis.byId(id).queryKey,
    queryFn: () => API<SharedAnalysisResponse>(getSharedAnalysisConfig(id)),
    retry: false,
  });

  if (isLoading) {
    return (
      <main className="flex h-screen flex-col" style={PAGE_BACKGROUND}>
        <Suspense>
          <TopBar />
        </Suspense>
        <SharedAnalysisSkeleton />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="flex h-screen flex-col" style={PAGE_BACKGROUND}>
        <Suspense>
          <TopBar />
        </Suspense>
        <SharedAnalysisError />
      </main>
    );
  }

  return (
    <AnalysisProvider
      initialShareUrl={shareUrl}
      initialCreatedAt={data.created_at}
    >
      <SharedAnalysisHydrator data={data}>
        <main
          className="flex h-screen flex-col"
          style={{
            background:
              "radial-gradient(113.99% 208.31% at 0% 0%, var(--slate-200, #E2E8F0) 0%, var(--base-white, #FFF) 50.96%, var(--emerald-50, #ECFDF5) 100%), #FFF",
          }}
        >
          <Suspense>
            <TopBar />
          </Suspense>

          <section className="flex h-full overflow-hidden">
            <aside className="flex h-full shrink-0">
              <div className="flex h-full w-[600px] shrink-0 flex-col">
                <AnalysisPanelContent
                  headerActions={
                    <ShareButton size="xl" className="font-bold" />
                  }
                />
              </div>
              <DataLayersPanel />
            </aside>

            <Suspense>
              <MapContainer className="flex-1 rounded-tl-3xl" />
            </Suspense>
          </section>
        </main>
      </SharedAnalysisHydrator>
    </AnalysisProvider>
  );
}
