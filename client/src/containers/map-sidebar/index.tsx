"use client";
import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/mapbox";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import DataLayersPanel from "@/containers/data-layers/panel";
import Analysis from "@/containers/map-sidebar/analysis";
import Main from "@/containers/map-sidebar/main";
import { cn } from "@/lib/utils";

const MapSidebar = () => {
  const { mapStatus } = useMapStatus();
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
      <DataLayersPanel />
    </aside>
  );
};

export default MapSidebar;
