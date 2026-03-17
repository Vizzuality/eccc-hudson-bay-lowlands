"use client";

import { useQuery } from "@tanstack/react-query";
import { Layer as RMLayer, Source as RMSource } from "react-map-gl/mapbox";
import {
  getDefaultVectorConfigFromTileJSON,
  getVectorLayerConfig,
} from "@/containers/map/layer-manager/item/utils";
import { env } from "@/env";
import type { LayerConfig } from "@/types";

interface VectorLayerManagerItemProps {
  id: number;
  path: string;
  settings: Record<string, unknown>;
  config: LayerConfig | null;
  beforeId?: string;
}

const VectorLayerManagerItem = ({
  id,
  path,
  settings,
  config,
  beforeId,
}: VectorLayerManagerItemProps) => {
  const { data: tileJSON } = useQuery({
    queryKey: ["tileset-tilejson", path],
    queryFn: async () => {
      const res = await fetch(
        `https://api.mapbox.com/v4/${path}.json?access_token=${env.NEXT_PUBLIC_MAPBOX_API_TOKEN}`,
      );
      return res.json();
    },
    enabled: !config,
    staleTime: Infinity,
  });

  const resolvedConfig =
    config ??
    (tileJSON?.vector_layers
      ? getDefaultVectorConfigFromTileJSON(tileJSON.vector_layers)
      : null);

  if (!resolvedConfig) return null;

  const { source, styles } = getVectorLayerConfig({
    path,
    settings,
    config: resolvedConfig,
    tileJSON,
  });

  return (
    <RMSource id={`${id}-source`} key={`${id}-source`} {...source}>
      {styles.map((style, i) => {
        const layerId = i === 0 ? id.toString() : `${id}-${i}`;
        return (
          <RMLayer
            key={layerId}
            id={layerId}
            beforeId={i === 0 ? beforeId : undefined}
            {...style}
          />
        );
      })}
    </RMSource>
  );
};

export default VectorLayerManagerItem;
