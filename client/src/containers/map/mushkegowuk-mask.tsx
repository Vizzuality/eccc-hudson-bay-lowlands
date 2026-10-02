import { useCallback, useEffect, useState } from "react";
import { Layer, Source, useMap } from "react-map-gl/mapbox";

import { getLayerAboveMask } from "@/containers/map/layer-manager/utils";

const SOURCE_ID = "mushkegowuk-mask";
const LAYER_ID = "mushkegowuk-mask-fill";
const LINE_LAYER_ID = "mushkegowuk-mask-line";

export function MushkegowukMask() {
  const { current: map } = useMap();

  const readBeforeId = useCallback(
    () =>
      getLayerAboveMask(map?.getStyle()?.layers?.map((l) => l.id) ?? [], [
        LAYER_ID,
        LINE_LAYER_ID,
      ]),
    [map],
  );
  const [beforeId, setBeforeId] = useState(readBeforeId);

  useEffect(() => {
    if (!map) return;
    const onStyleData = () => setBeforeId(readBeforeId());
    map.on("styledata", onStyleData);
    return () => {
      map.off("styledata", onStyleData);
    };
  }, [map, readBeforeId]);

  if (beforeId === null) return null;

  return (
    <Source id={SOURCE_ID} type="vector" url="mapbox://ecc-design.seup5z">
      <Layer
        id={LAYER_ID}
        type="fill"
        source-layer="Mushkegowuk_Territory.zip-7y7ur2"
        beforeId={beforeId}
        paint={{
          "fill-color": "rgb(4, 55, 44)",
          "fill-opacity": 0.35,
        }}
      />
      <Layer
        id={LINE_LAYER_ID}
        type="line"
        source-layer="Mushkegowuk_Territory.zip-7y7ur2"
        beforeId={beforeId}
        paint={{
          "line-color": "#ffffff",
          "line-width": 1,
          "line-opacity": 0.5,
        }}
      />
    </Source>
  );
}
