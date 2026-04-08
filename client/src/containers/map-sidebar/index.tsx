"use client";
import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/mapbox";
import {
  MapStatus,
  useMapAnalysis,
  useMapStatus,
} from "@/app/[locale]/url-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import DataLayersList from "@/containers/data-layers/list";
import Analysis from "@/containers/map-sidebar/analysis";
import Main from "@/containers/map-sidebar/main";
import { cn } from "@/lib/utils";

const MapSidebar = () => {
  const { mapStatus } = useMapStatus();
  const { datasets } = useMapAnalysis();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { default: mapRef } = useMap();

  const isHidden = mapStatus === MapStatus.upload;

  useEffect(() => {
    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === "width") {
        mapRef?.resize();
      }
    };

    const sidebarElement = sidebarRef.current;
    sidebarElement?.addEventListener(
      "transitionend",
      handleTransitionEnd,
      true,
    );

    return () => {
      sidebarElement?.removeEventListener(
        "transitionend",
        handleTransitionEnd,
        true,
      );
    };
  }, [mapRef]);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 overflow-hidden transition-opacity duration-300 ease-in-out",
        isHidden && "opacity-0",
      )}
      ref={sidebarRef}
    >
      <div
        className={cn(
          "h-full shrink-0 overflow-hidden transition-[width,opacity,padding] duration-300 ease-in-out",
          isHidden ? "w-0" : "w-[600px]",
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          {mapStatus === MapStatus.analysis ? <Analysis /> : <Main />}
        </div>
      </div>
      <div
        className={cn(
          "h-full min-h-0 shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-in-out",
          datasets ? "w-[350px] opacity-100" : "w-0 opacity-0",
        )}
      >
        <ScrollArea className="h-full w-full pt-6">
          <DataLayersList datasets={[]} isLoading={false} className="pb-6" />
        </ScrollArea>
      </div>
    </aside>
  );
};

export default MapSidebar;
