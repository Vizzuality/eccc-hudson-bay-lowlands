import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { Feature } from "geojson";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import useAnalysisSettings, {
  useIsAnalyzing,
  useSetAnalysisResult,
} from "@/hooks/use-analysis-settings";
import { API } from "@/lib/api";
import { postAnalysisConfig } from "@/lib/api/config";
import type {
  ParsedGeoJSON,
  UploadErrorType,
} from "@/lib/utils/geometry-upload";
import { parseGeometryFile } from "@/lib/utils/geometry-upload";
import type { AnalysisResponse } from "@/types";
import { mapUploadError, type UploadBarError } from "./types";

export function useUploadAnalysis() {
  const { mapStatus, setMapStatus } = useMapStatus();
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<UploadBarError | null>(null);
  const [{ geometry, locationType, fileName }, setAnalysisSettings] =
    useAnalysisSettings();
  const setAnalysisResult = useSetAnalysisResult();
  const [, setIsAnalyzing] = useIsAnalyzing();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: postAnalysis, isPending } = useMutation({
    mutationFn: (geo: GeoJSON.Feature | GeoJSON.FeatureCollection) => {
      setIsAnalyzing(true);
      return API<AnalysisResponse>(postAnalysisConfig(geo));
    },
    onSuccess: (data) => {
      setIsAnalyzing(false);
      setIsDrawing(false);
      setAnalysisResult(data);
      setMapStatus(MapStatus.analysis);
    },
    onError: (err) => {
      setIsAnalyzing(false);
      if (isAxiosError(err) && err.response?.status === 422) {
        const detail: unknown = err.response.data?.detail;
        if (typeof detail === "string") {
          if (
            detail.includes("exceeds the maximum") ||
            detail.includes("below the minimum")
          ) {
            setError("area-too-big");
          } else if (
            detail.includes("does not intersect") ||
            detail.includes("must lie entirely within")
          ) {
            setError("outside-of-bounds");
          } else if (detail.includes("structurally invalid")) {
            setError("invalid-geometry");
          } else {
            setError("generic-error");
          }
          return;
        }
      }
      setError("generic-error");
    },
  });

  const resetState = useCallback(() => {
    setError(null);
    setIsDrawing(false);
    setAnalysisSettings((settings) => ({
      ...settings,
      locationType: "draw",
      geometry: null,
      fileName: null,
    }));
  }, [setAnalysisSettings]);

  const onUpdateGeometry = useCallback(
    ({ features }: { features: Feature[] }) => {
      const geo = (features[0] as ParsedGeoJSON) ?? null;
      setError(null);
      setAnalysisSettings((settings) => ({
        ...settings,
        locationType: "draw" as const,
        geometry: geo,
        fileName: null,
      }));
    },
    [setAnalysisSettings],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      e.target.value = "";
      setError(null);

      try {
        const parsed = await parseGeometryFile(file);
        setAnalysisSettings((settings) => ({
          ...settings,
          locationType: "upload" as const,
          geometry: parsed,
          fileName: file.name,
        }));
      } catch (uploadError) {
        setAnalysisSettings((settings) => ({
          ...settings,
          locationType: "upload" as const,
          geometry: null,
          fileName: file.name,
        }));
        setError(mapUploadError(uploadError as UploadErrorType));
      }
      setIsDrawing(true);
    },
    [setAnalysisSettings],
  );

  const handleConfirm = useCallback(() => {
    if (!geometry) return;
    postAnalysis(geometry);
  }, [geometry, postAnalysis]);

  useEffect(() => {
    if (mapStatus === MapStatus.default) {
      resetState();
    }
  }, [mapStatus, resetState]);

  return {
    mapStatus,
    isDrawing,
    setIsDrawing,
    error,
    isPending,
    geometry,
    locationType,
    fileName,
    fileInputRef,
    onUpdateGeometry,
    handleFileChange,
    handleConfirm,
    resetState,
  };
}

export function useSidebarCollapsed() {
  const { mapStatus } = useMapStatus();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (mapStatus !== MapStatus.upload) {
      setSidebarCollapsed(false);
      return;
    }

    const sidebar = document.querySelector("aside");
    if (!sidebar) {
      setSidebarCollapsed(true);
      return;
    }

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target === sidebar && e.propertyName === "opacity") {
        sidebar.removeEventListener("transitionend", onTransitionEnd);
        setSidebarCollapsed(true);
      }
    };
    sidebar.addEventListener("transitionend", onTransitionEnd);

    const fallback = setTimeout(() => {
      sidebar.removeEventListener("transitionend", onTransitionEnd);
      setSidebarCollapsed(true);
    }, 500);

    return () => {
      clearTimeout(fallback);
      sidebar.removeEventListener("transitionend", onTransitionEnd);
    };
  }, [mapStatus]);

  return sidebarCollapsed;
}
