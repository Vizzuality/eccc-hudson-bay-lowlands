"use client";

import {
  type LayerProps,
  Layer as RMLayer,
  Source as RMSource,
  type SourceProps,
} from "react-map-gl/mapbox";
import { type Config, parseConfig } from "@/lib/json-converter";

interface VectorLayerManagerItemProps {
  id: number;
  path: string;
  settings: Record<string, unknown>;
  beforeId?: string;
}

const VectorLayerManagerItem = ({
  id,
  path,
  settings,
  beforeId,
}: VectorLayerManagerItemProps) => {
  const visibility = settings.visibility ?? true;

  const c = parseConfig<Config>({
    config: {
      source: {
        url: `mapbox://${path}`,
        type: "vector",
      },
      styles: [
        {
          type: "fill",
          layout: {
            visibility: visibility ? "visible" : "none",
          },
        },
      ],
    },
    params_config: [
      {
        key: "visibility",
        default: true,
      },
    ],
    settings,
  });

  const source = c?.source as SourceProps;
  const styles = c?.styles as LayerProps[];

  return (
    <RMSource id={`${id}-source`} key={`${id}-source`} {...source}>
      {styles.map((style) => (
        <RMLayer
          key={`${id}-layer`}
          id={id.toString()}
          beforeId={beforeId}
          {...style}
        />
      ))}
    </RMSource>
  );
};

export default VectorLayerManagerItem;
