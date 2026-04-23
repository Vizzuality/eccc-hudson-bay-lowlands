"use client";

import { DownloadIcon, LoaderCircleIcon } from "lucide-react";
import type { RefObject } from "react";
import { useMapDownload } from "@/hooks/use-map-download";
import { cn } from "@/lib/utils";
import { CONTROL_BUTTON_STYLES } from "../constants";

interface MapDownloadProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export default function MapDownload({ containerRef }: MapDownloadProps) {
  const { download, loading } = useMapDownload(containerRef);

  return (
    <button
      className={cn({
        [CONTROL_BUTTON_STYLES.default]: true,
        [CONTROL_BUTTON_STYLES.hover]: !loading,
        [CONTROL_BUTTON_STYLES.active]: !loading,
        [CONTROL_BUTTON_STYLES.disabled]: loading,
      })}
      aria-label="Download map image"
      type="button"
      disabled={loading}
      onClick={download}
    >
      {loading ? (
        <LoaderCircleIcon
          className={cn(CONTROL_BUTTON_STYLES.icon, "animate-spin")}
        />
      ) : (
        <DownloadIcon className={CONTROL_BUTTON_STYLES.icon} />
      )}
    </button>
  );
}
