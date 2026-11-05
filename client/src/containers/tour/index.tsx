"use client";

import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_LAYER_IDS,
  MapStatus,
  useLayerIds,
  useMapStatus,
} from "@/app/[locale]/url-store";
import { useMainDatasets } from "@/containers/map-sidebar/main/use-main-datasets";
import { Hotspots } from "@/containers/tour/hotspots";
import { Spotlight } from "@/containers/tour/spotlight";
import { MAP_TOUR_STEPS, type TourStepId } from "@/containers/tour/steps";
import {
  legendOpenAtom,
  openDatasetIdsAtom,
  tourAvailableAtom,
} from "@/containers/tour/store";
import { TourCard } from "@/containers/tour/tour-card";
import { useMapTour } from "@/containers/tour/use-map-tour";
import { useTargetRect } from "@/containers/tour/use-target-rect";
import { useIsMobile } from "@/hooks/use-is-mobile";

const TOTAL_COUNTED = MAP_TOUR_STEPS.filter((step) => step.counted).length;

function useStepEffects(stepId: TourStepId | undefined) {
  const { data: datasets } = useMainDatasets();
  const { layerIds, setLayerIds } = useLayerIds();
  const setOpenDatasetIds = useSetAtom(openDatasetIdsAtom);
  const setLegendOpen = useSetAtom(legendOpenAtom);
  const firstDatasetId = datasets?.[0]?.id;
  const hasLayers = layerIds.length > 0;

  useEffect(() => {
    if (stepId !== "add-layers" || firstDatasetId === undefined) return;
    const id = String(firstDatasetId);
    setOpenDatasetIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }, [stepId, firstDatasetId, setOpenDatasetIds]);

  useEffect(() => {
    if (stepId !== "control-layers") return;
    if (!hasLayers) void setLayerIds(DEFAULT_LAYER_IDS);
    setLegendOpen(true);
  }, [stepId, hasLayers, setLayerIds, setLegendOpen]);
}

export default function MapTour() {
  const isMobile = useIsMobile();
  const { mapStatus } = useMapStatus();
  const setAvailable = useSetAtom(tourAvailableAtom);
  const { index, step, next, back, close } = useMapTour();
  const anchorRef = useRef<HTMLDivElement>(null);
  const rect = useTargetRect(step?.selector ?? null);
  const available = !isMobile && mapStatus === MapStatus.default;

  useEffect(() => {
    setAvailable(available);
    if (!available) close();
  }, [available, setAvailable, close]);

  useEffect(() => () => setAvailable(false), [setAvailable]);

  useStepEffects(step?.id);

  if (index === null || !step || !available) return null;

  const current = MAP_TOUR_STEPS.slice(0, index + 1).filter(
    (s) => s.counted,
  ).length;

  return (
    <>
      {createPortal(
        <>
          <Spotlight ref={anchorRef} rect={rect} shape={step.shape} />
          {step.hotspotSelector && <Hotspots selector={step.hotspotSelector} />}
        </>,
        document.body,
      )}
      <TourCard
        step={step}
        current={current}
        total={TOTAL_COUNTED}
        anchorRef={anchorRef}
        hasTarget={!!rect}
        isFirst={index === 0}
        isLast={index === MAP_TOUR_STEPS.length - 1}
        onNext={next}
        onBack={back}
        onClose={close}
      />
    </>
  );
}
