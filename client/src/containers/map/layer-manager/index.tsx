"use client";

import { type FC, useMemo } from "react";

import { Layer, useMap } from "react-map-gl/mapbox";
import { useLayerManager } from "@/containers/map/layer-manager/hooks";
import LayerManagerItem from "./item";

export type LayersSettings<T> = Record<string, Record<string, T>>;

export const LayerManager: FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  const { current: map } = useMap();
  const { layers } = useLayerManager();
  const baseLayer = useMemo(() => {
    if (map && map.isStyleLoaded()) {
      const layers = map!.getStyle()!.layers;
      // Find the custom layer to be able to sort the layers
      const customLayer = layers?.find((l) => l.id.includes("custom-layer"));
      // Find the first label layer to be able to sort the layers if there is no custom layer
      const labelLayer = layers?.find((l) => l.id.includes("label"));
      return customLayer ? customLayer.id : labelLayer?.id;
    }
  }, [map]);

  const LAYERS = useMemo(() => {
    return layers.toReversed();
  }, [layers]);

  return (
    <>
      {children}
      {/*
          Generate all transparent backgrounds to be able to sort by layers without an error
          - https://github.com/visgl/react-map-gl/issues/939#issuecomment-625290200
        */}
      {LAYERS.map((l, i, arr) => {
        const beforeId = i === 0 ? baseLayer : `${arr[i - 1].id}-layer`;

        return (
          <Layer
            id={`${l.id}-layer`}
            key={l.id.toString()}
            type="background"
            layout={{ visibility: "none" }}
            beforeId={beforeId}
          />
        );
      })}

      {/*
          Loop through active layers. The id is gonna be used to fetch the current layer and know how to order the layers.
          The first item will always be at the top of the layers stack
        */}
      {LAYERS.map((l, i, arr) => {
        const beforeId = i === 0 ? baseLayer : `${arr[i - 1].id}-layer`;

        return (
          <LayerManagerItem
            key={l.id.toString()}
            id={l.id}
            beforeId={beforeId}
          />
        );
      })}
    </>
  );
};
