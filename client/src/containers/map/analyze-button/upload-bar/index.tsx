import { MapStatus } from "@/app/[locale]/url-store";
import QuestionMarkIcon from "@/components/icons/question-mark";
import TileIcon from "@/components/icons/tile";
import { PopoverContent } from "@/components/ui/popover";
import useMapDraw from "@/hooks/use-map-draw";
import type { ValidGeometryType } from "@/lib/utils/geometry-upload";
import { DrawingConfirmation } from "./drawing-confirmation";
import { UploadInstructions } from "./upload-instructions";
import { useSidebarCollapsed, useUploadAnalysis } from "./use-upload-analysis";

const UploadBar = () => {
  const sidebarCollapsed = useSidebarCollapsed();
  const {
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
  } = useUploadAnalysis();

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

  const handleClear = () => {
    redraw();
    resetState();
  };

  if (!sidebarCollapsed) return null;

  const hasGeometry = !!geometry;

  return (
    <PopoverContent
      side="bottom"
      align="start"
      className="flex flex-col gap-4 overflow-hidden w-[335px] text-sm font-medium leading-5 p-6"
      onInteractOutside={(e) => e.preventDefault()}
    >
      <TileIcon
        state={hasGeometry ? "checked" : isDrawing ? "drawing" : "default"}
      >
        <QuestionMarkIcon />
      </TileIcon>
      {isDrawing ? (
        <DrawingConfirmation
          isPending={isPending}
          locationType={locationType}
          fileName={fileName}
          error={error}
          hasGeometry={hasGeometry}
          onClear={handleClear}
          onConfirm={handleConfirm}
        />
      ) : (
        <UploadInstructions
          error={error}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
        />
      )}
    </PopoverContent>
  );
};

export default UploadBar;
