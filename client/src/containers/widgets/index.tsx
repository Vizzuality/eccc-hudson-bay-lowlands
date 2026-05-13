"use client";

import { type FC, useState } from "react";
import type { AnalysisResult } from "@/containers/analysis/types";
import DatasetDialog from "@/containers/dataset-dialog";
import CarbonPeatland from "@/containers/widgets/carbon-peatland";
import EcosystemTypes from "@/containers/widgets/ecosystem-types";
import FloodSusceptibility from "@/containers/widgets/flood-susceptibility";
import SnowDynamics from "@/containers/widgets/snow-dynamics";
import TreeCoverChange from "@/containers/widgets/tree-cover-change";
import WaterDynamics from "@/containers/widgets/water-dynamics";
import type { Dataset } from "@/types";

interface WidgetProps {
  id: keyof AnalysisResult;
  data: AnalysisResult;
}

const Widget: FC<WidgetProps> = ({ id, data }) => {
  const [dialogDataset, setDialogDataset] = useState<Dataset | null>(null);

  const onInfoButtonClick = () => setDialogDataset(data[id].dataset);

  const widget = (() => {
    switch (id) {
      case "peat_carbon":
        return (
          <CarbonPeatland
            id={id}
            stats={data[id].stats}
            chart={data[id].chart}
            layers={data[id].dataset.layers ?? []}
            onInfoButtonClick={onInfoButtonClick}
          />
        );
      case "water_dynamics":
        return (
          <WaterDynamics
            id={id}
            unit={data[id].unit}
            stats={data[id].stats}
            layers={data[id].dataset.layers ?? []}
            onInfoButtonClick={onInfoButtonClick}
          />
        );
      case "flood_susceptibility":
        return (
          <FloodSusceptibility
            id={id}
            stats={data[id].stats}
            layers={data[id].dataset.layers ?? []}
            onInfoButtonClick={onInfoButtonClick}
          />
        );
      case "snow_dynamics":
        return (
          <SnowDynamics
            id={id}
            stats={data[id].stats}
            layers={data[id].dataset.layers ?? []}
            onInfoButtonClick={onInfoButtonClick}
          />
        );
      case "treed_area":
        return (
          <TreeCoverChange
            id={id}
            stats={data[id].stats}
            layers={data[id].dataset.layers ?? []}
            onInfoButtonClick={onInfoButtonClick}
          />
        );
      case "ecosystem_classification":
        return (
          <EcosystemTypes
            id={id}
            stats={data[id].stats}
            layers={data[id].dataset.layers ?? []}
            onInfoButtonClick={onInfoButtonClick}
          />
        );
      default:
        console.error(`Widget for id "${id}" not found`);
        return null;
    }
  })();

  return (
    <>
      {widget}
      <DatasetDialog
        open={!!dialogDataset}
        onOpenChange={() => setDialogDataset(null)}
        dataset={dialogDataset}
      />
    </>
  );
};

export default Widget;
