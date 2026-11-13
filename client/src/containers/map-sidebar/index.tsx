"use client";
import { MapStatus, useMapStatus } from "@/app/[locale]/url-store";
import DataLayersPanel from "@/containers/data-layers/panel";
import Analysis from "@/containers/map-sidebar/analysis";
import Main from "@/containers/map-sidebar/main";
import MapTour from "@/containers/tour";
import AnalysisTour from "@/containers/tour/analysis-tour";

const MapSidebar = () => {
  const { mapStatus } = useMapStatus();
  const isAnalysis = mapStatus === MapStatus.analysis;

  return (
    <aside
      className="isolate flex h-full shrink-0 overflow-hidden"
      inert={mapStatus === MapStatus.upload}
    >
      <div className="h-full w-(--sidebar-width) shrink-0 overflow-hidden">
        <div
          key={isAnalysis ? "analysis" : "main"}
          data-tour="main-sidebar"
          data-sidebar-content
          className="flex h-full min-h-0 flex-col animate-in fade-in duration-200 motion-reduce:animate-none"
        >
          {isAnalysis ? <Analysis /> : <Main />}
        </div>
      </div>
      <DataLayersPanel />
      <MapTour />
      <AnalysisTour />
    </aside>
  );
};

export default MapSidebar;
