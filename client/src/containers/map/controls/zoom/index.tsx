"use client";

import { ZoomInIcon, ZoomOutIcon } from "lucide-react";
import {
  type FC,
  type HTMLAttributes,
  type MouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useMap } from "react-map-gl/mapbox";
import { useDebounceCallback } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { CONTROL_BUTTON_STYLES } from "../constants";

interface ZoomControlProps {
  className?: HTMLAttributes<HTMLDivElement>["className"];
}

export const ZoomControl: FC<ZoomControlProps> = ({
  className,
}: ZoomControlProps) => {
  const { current: mapRef } = useMap();
  const [zoom, setZoom] = useState<number>(Math.round(mapRef?.getZoom() ?? 0));
  const minZoom = mapRef?.getMinZoom();
  const maxZoom = mapRef?.getMaxZoom();

  const increaseZoom = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      mapRef?.zoomIn();
    },
    [mapRef],
  );

  const decreaseZoom = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      mapRef?.zoomOut();
    },
    [mapRef],
  );

  const handleZoom = useDebounceCallback(() => {
    if (mapRef) {
      const newZoom = Math.round(mapRef.getZoom());
      setZoom(newZoom);
    }
  }, 100);

  useEffect(() => {
    if (mapRef) {
      mapRef.on("zoom", handleZoom);
    }
    return () => {
      if (mapRef) {
        mapRef.off("zoom", handleZoom);
      }
    };
  }, [handleZoom, mapRef]);

  return (
    <div className={cn("flex flex-col", className)}>
      <button
        className={cn({
          [CONTROL_BUTTON_STYLES.default]: true,
          "rounded-none rounded-t-full border-b-0": true,
          [CONTROL_BUTTON_STYLES.hover]: zoom !== maxZoom,
          [CONTROL_BUTTON_STYLES.active]: zoom !== maxZoom,
          [CONTROL_BUTTON_STYLES.disabled]: zoom === maxZoom,
        })}
        aria-label="Zoom in"
        type="button"
        disabled={zoom === maxZoom}
        onClick={increaseZoom}
      >
        <ZoomInIcon className={CONTROL_BUTTON_STYLES.icon} />
      </button>
      <button
        className={cn({
          [CONTROL_BUTTON_STYLES.default]: true,
          "rounded-none rounded-b-full border-t-0": true,
          [CONTROL_BUTTON_STYLES.hover]: zoom !== minZoom,
          [CONTROL_BUTTON_STYLES.active]: zoom !== minZoom,
          [CONTROL_BUTTON_STYLES.disabled]: zoom === minZoom,
        })}
        aria-label="Zoom out"
        type="button"
        disabled={zoom === minZoom}
        onClick={decreaseZoom}
      >
        <ZoomOutIcon className={CONTROL_BUTTON_STYLES.icon} />
      </button>
    </div>
  );
};

export default ZoomControl;
