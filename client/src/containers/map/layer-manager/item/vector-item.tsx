"use client";

import { Layer as RMLayer, Source as RMSource } from "react-map-gl/mapbox";
import { getVectorLayerConfig } from "@/containers/map/layer-manager/item/utils";
import type { LayerConfig } from "@/types";

interface VectorLayerManagerItemProps {
  id: string;
  path: string;
  settings: Record<string, unknown>;
  config: LayerConfig;
  beforeId?: string;
}

const VectorLayerManagerItem = ({
  id,
  path,
  settings,
  config,
  beforeId,
}: VectorLayerManagerItemProps) => {
  const { source, styles } = getVectorLayerConfig({ path, settings, config });

  return (
    <RMSource id={`${id}-source`} key={`${id}-source`} {...source}>
      {styles.map((style, i) => {
        const styleId = style.id ?? (i === 0 ? id.toString() : `${id}-${i}`);
        return (
          <RMLayer {...style} key={styleId} id={styleId} beforeId={beforeId} />
        );
      })}
    </RMSource>
  );
};

export default VectorLayerManagerItem;
