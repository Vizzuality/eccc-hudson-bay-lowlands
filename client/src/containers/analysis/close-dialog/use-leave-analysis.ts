import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import {
  MapStatus,
  useMapAnalysis,
  useMapStatus,
  useMobileView,
} from "@/app/[locale]/url-store";
import useAnalysisSettings, {
  useSetAnalysisResult,
} from "@/hooks/use-analysis-settings";

const SIDEBAR_FADE_OUT_MS = 150;

export function useLeaveAnalysis() {
  const { id: sharedAnalysisId } = useParams<{ id?: string }>();
  const router = useRouter();
  const { setMapStatus } = useMapStatus();
  const { setMobileView } = useMobileView();
  const { setDatasets } = useMapAnalysis();
  const setAnalysisResult = useSetAnalysisResult();
  const [, setAnalysisSettings, initialAnalysisSettings] =
    useAnalysisSettings();

  const resetAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setAnalysisSettings(initialAnalysisSettings);
    setMapStatus(MapStatus.default);
    setMobileView(null);
    setDatasets(null);
  }, [
    setAnalysisResult,
    setAnalysisSettings,
    initialAnalysisSettings,
    setMapStatus,
    setMobileView,
    setDatasets,
  ]);

  const leaveAnalysis = useCallback(async () => {
    if (sharedAnalysisId) {
      router.push("/");
      return;
    }

    const content = document.querySelector("[data-sidebar-content]");
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (content && !reducedMotion) {
      await content.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: SIDEBAR_FADE_OUT_MS,
        easing: "ease-in",
        fill: "forwards",
      }).finished;
    }

    resetAnalysis();
  }, [sharedAnalysisId, router, resetAnalysis]);

  return { leaveAnalysis, resetAnalysis };
}
