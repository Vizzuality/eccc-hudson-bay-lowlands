"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlertIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useLayoutEffect } from "react";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import { AnalysisProvider } from "@/containers/analysis/analysis-context";
import MapLayout from "@/containers/map-layout";
import SharedAnalysisSidebar from "@/containers/shared-analysis-sidebar";
import { SharedAnalysisSkeleton } from "@/containers/skeletons";
import useAnalysisSettings, {
  useAnalysisResult,
  useSetAnalysisResult,
} from "@/hooks/use-analysis-settings";
import { API } from "@/lib/api";
import { getSharedAnalysisConfig } from "@/lib/api/config";
import { queryKeys } from "@/lib/query-keys";
import type { ParsedGeoJSON } from "@/lib/utils/geometry-upload";
import type { SharedAnalysisResponse } from "@/types";

function SharedAnalysisHydrator({
  data,
  children,
}: Readonly<{
  data: SharedAnalysisResponse;
  children: ReactNode;
}>) {
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
      <MapLayout>
        <SharedAnalysisSkeleton />
      </MapLayout>
    );
  }

  if (isError || !data) {
    return (
      <MapLayout>
        <SharedAnalysisError />
      </MapLayout>
    );
  }

  return (
    <AnalysisProvider
      initialShareUrl={shareUrl}
      initialCreatedAt={data.created_at}
    >
      <SharedAnalysisHydrator data={data}>
        <MapLayout sidebar={<SharedAnalysisSidebar />} />
      </SharedAnalysisHydrator>
    </AnalysisProvider>
  );
}
