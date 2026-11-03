"use client";

import { type FC, useCallback, useEffect, useMemo, useState } from "react";

import { Layer, useMap } from "react-map-gl/mapbox";
import { useLayerIds } from "@/app/[locale]/url-store";
import { useAboveMaskLayerIds } from "@/containers/map/layer-manager/hooks";
import LayerManagerItem from "@/containers/map/layer-manager/item";
import {
  getLayerAboveMask,
  getLayerPlacements,
} from "@/containers/map/layer-manager/utils";

export const LayerManager: FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const { current: map } = useMap();
  const { layerIds } = useLayerIds();
  const aboveMaskIds = useAboveMaskLayerIds();
  const baseLayer = useMemo(() => {
    if (map) {
      const layers = map.getStyle()?.layers;
      // Find the custom layer to be able to sort the layers
      const customLayer = layers?.find((l) => l.id.includes("custom-layers"));
      // Find the first label layer to be able to sort the layers if there is no custom layer
      const labelLayer = layers?.find((l) => l.id.includes("label"));
      return customLayer ? customLayer.id : labelLayer?.id;
    }
  }, [map]);

  const readMaskAnchor = useCallback(() => {
    const styleLayers = map?.getStyle()?.layers ?? [];
    const ownLayerIds = styleLayers
      .filter((l) =>
        layerIds.some(
          (id) =>
            l.id === `${id}-layer` ||
            ("source" in l && l.source === `${id}-source`),
        ),
      )
      .map((l) => l.id);
    return getLayerAboveMask(
      styleLayers.map((l) => l.id),
      ownLayerIds,
    );
  }, [map, layerIds]);
  const [maskAnchor, setMaskAnchor] = useState(readMaskAnchor);

  useEffect(() => {
    if (!map) return;
    const onStyleData = () => setMaskAnchor(readMaskAnchor());
    onStyleData();
    map.on("styledata", onStyleData);
    return () => {
      map.off("styledata", onStyleData);
    };
  }, [map, readMaskAnchor]);

  const LAYERS = useMemo(() => {
    return getLayerPlacements(
      layerIds.toReversed(),
      aboveMaskIds,
      baseLayer,
      maskAnchor,
    );
  }, [layerIds, aboveMaskIds, baseLayer, maskAnchor]);

  return (
    <>
      {children}
      {/*
          Generate all transparent backgrounds to be able to sort by layers without an error
          - https://github.com/visgl/react-map-gl/issues/939#issuecomment-625290200
        */}
      {LAYERS.map(({ id, beforeId }) => (
        <Layer
          id={`${id}-layer`}
          key={id}
          type="background"
          layout={{ visibility: "none" }}
          beforeId={beforeId}
        />
      ))}

      {/*
          Loop through active layers. The id is gonna be used to fetch the current layer and know how to order the layers.
          The first item will always be at the top of the layers stack
        */}
      {LAYERS.map(({ id, beforeId }) => (
        <LayerManagerItem key={id} id={id} beforeId={beforeId} />
      ))}
    </>
  );
};
