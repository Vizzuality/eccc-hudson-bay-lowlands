import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LoaderCircleIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import QuestionMarkIcon from "@/components/icons/question-mark";
import TileIcon from "@/components/icons/tile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import RichText from "@/components/ui/rich-text";
import { UploadErrorAlert } from "@/containers/map/analyze-button/upload-bar/error-alert";
import { useUploadAnalysis } from "@/containers/map/analyze-button/upload-bar/use-upload-analysis";
import { MobileNav, type MobileNavItem } from "@/containers/mobile-nav";
import useMapDraw from "@/hooks/use-map-draw";
import type { ValidGeometryType } from "@/lib/utils/geometry-upload";

const MobileAnalysis = () => {
  const t = useTranslations("analysis");
  const { setMapStatus } = useMapStatus();
  const {
    mapStatus,
    isDrawing,
    setIsDrawing,
    error,
    isPending,
    geometry,
    locationType,
    onUpdateGeometry,
    handleConfirm,
    resetState,
  } = useUploadAnalysis();
  const [open, setOpen] = useState(true);

  const { redraw } = useMapDraw({
    enabled:
      mapStatus === MapStatus.upload && locationType === "draw" && !isPending,
    styleVariant: mapStatus === MapStatus.analysis ? "analysis" : "draw",
    geometry:
      geometry && geometry.type === "Feature"
        ? (geometry as GeoJSON.Feature<ValidGeometryType>)
        : undefined,
    onCreate: onUpdateGeometry,
    onUpdate: onUpdateGeometry,
    onDrawingStart: () => setIsDrawing(true),
  });

  const [prev, setPrev] = useState({ isDrawing, isPending, error });
  if (
    prev.isDrawing !== isDrawing ||
    prev.isPending !== isPending ||
    prev.error !== error
  ) {
    if (prev.isDrawing !== isDrawing || isPending || error) setOpen(true);
    setPrev({ isDrawing, isPending, error });
  }

  if (mapStatus !== MapStatus.upload) return null;

  const handleClear = () => {
    redraw();
    resetState();
  };

  const items: MobileNavItem[] = isDrawing
    ? [
        {
          id: "clear",
          label: t("clear"),
          icon: TrashIcon,
          cta: true,
          variant: "secondary",
          disabled: isPending,
          onClick: handleClear,
        },
        {
          id: "confirm",
          label: t("confirm"),
          icon: CheckIcon,
          cta: true,
          disabled: !!error || !geometry || isPending,
          onClick: handleConfirm,
        },
      ]
    : [
        {
          id: "cancel",
          label: t("mobile.cancel-analysis"),
          icon: XIcon,
          cta: true,
          onClick: () => setMapStatus(MapStatus.default),
        },
      ];

  return (
    <>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        data-download-exclude
        className="absolute inset-x-4 bottom-24 z-10 rounded-3xl bg-background text-sm font-medium leading-5 shadow-md lg:hidden"
      >
        {open ? (
          <div className="relative flex flex-col gap-4 p-6">
            <CollapsibleTrigger
              aria-label={t("mobile.hide-instructions")}
              className="absolute top-4 right-4 rounded-full p-2"
            >
              <ChevronDownIcon className="size-4" aria-hidden />
            </CollapsibleTrigger>
            <TileIcon state={geometry ? "checked" : "default"}>
              <QuestionMarkIcon />
            </TileIcon>
            <CollapsibleContent className="flex flex-col gap-4">
              <div aria-live="polite">
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <LoaderCircleIcon
                      className="size-4 animate-spin"
                      aria-hidden
                    />
                    <span>{t("analyzing")}</span>
                  </div>
                ) : (
                  <RichText>
                    {(tags) =>
                      t.rich(
                        isDrawing
                          ? "mobile.verify-shape"
                          : "mobile.instructions",
                        { ...tags },
                      )
                    }
                  </RichText>
                )}
              </div>
              {error && <UploadErrorAlert error={error} />}
            </CollapsibleContent>
          </div>
        ) : (
          <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-5 font-bold">
            {t("mobile.show-instructions")}
            <ChevronUpIcon className="size-4" aria-hidden />
          </CollapsibleTrigger>
        )}
      </Collapsible>
      <MobileNav as="div" items={items} />
    </>
  );
};

export default MobileAnalysis;
