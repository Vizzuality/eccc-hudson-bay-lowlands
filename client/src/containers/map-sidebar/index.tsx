"use client";
import { useEffect, useRef, useState } from "react";
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
  const [isCollapsed, setIsCollapsed] = useState(isHidden);

  useEffect(() => {
    if (!isHidden) {
      setIsCollapsed(false);
      requestAnimationFrame(() => mapRef?.resize());
      return;
    }

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.target === sidebar && e.propertyName === "opacity") {
        setIsCollapsed(true);
        requestAnimationFrame(() => mapRef?.resize());
      }
    };

    sidebar.addEventListener("transitionend", handleTransitionEnd);

    const fallback = setTimeout(() => {
      sidebar.removeEventListener("transitionend", handleTransitionEnd);
      setIsCollapsed(true);
      requestAnimationFrame(() => mapRef?.resize());
    }, 500);

    return () => {
      clearTimeout(fallback);
      sidebar.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, [isHidden, mapRef]);

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
          "h-full shrink-0 overflow-hidden",
          isCollapsed ? "w-0" : "w-[480px] min-[1440px]:w-[600px]",
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
